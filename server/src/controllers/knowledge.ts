import { Response } from 'express';
import { KnowledgeItem } from '../models/KnowledgeItem';
import { KnowledgeVersion } from '../models/KnowledgeVersion';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { KnowledgeCategory } from '../../../shared/types/knowledge';

// Ingress parsing and text normalizer cleaner
export const cleanTextSegment = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
    .replace(/[ \t]+/g, ' ')      // Normalize duplicate spaces
    .replace(/--+ page \d+ --+/gi, '') // Remove page footer patterns
    .trim();
};

// Automatic Category Classifier based on keywords
export const classifyCategory = (title: string, content: string): KnowledgeCategory => {
  const composite = `${title} ${content}`.toLowerCase();

  if (composite.includes('syllabus') || composite.includes('course') || composite.includes('class')) {
    return 'Courses';
  }
  if (composite.includes('workshop') || composite.includes('seminar')) {
    return 'Workshops';
  }
  if (composite.includes('internship') || composite.includes('placement') || composite.includes('stipend')) {
    return 'Internships';
  }
  if (composite.includes('faq') || composite.includes('frequently asked')) {
    return 'FAQs';
  }
  if (composite.includes('policy') || composite.includes('rules') || composite.includes('guidelines')) {
    return 'Policies';
  }
  if (composite.includes('uav') || composite.includes('drone') || composite.includes('aeronautical')) {
    return 'Engineering Domains';
  }
  return 'General';
};

// Evaluate quality metric score (0-100) based on structure and formatting checks
export const calculateQualityScore = (sections: any[]): number => {
  if (!sections || sections.length === 0) return 0;

  let score = 100;
  // Penalty for empty headings
  const hasEmptyHeadings = sections.some((s) => !s.heading || s.heading.trim().length === 0);
  if (hasEmptyHeadings) score -= 20;

  // Penalty for short segments
  const shortSegmentsCount = sections.filter((s) => s.content && s.content.trim().length < 20).length;
  score -= shortSegmentsCount * 5;

  return Math.max(0, score);
};

export const createKnowledgeDraft = async (req: AuthenticatedRequest, res: Response) => {
  const { title, sections, source, metadata } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Content cleaning normalizations
    const cleanedSections = (sections || []).map((sec: any) => ({
      heading: sec.heading,
      subheading: sec.subheading,
      content: cleanTextSegment(sec.content),
      contentType: sec.contentType || 'paragraph'
    }));

    const category = classifyCategory(title, cleanedSections.map((s: any) => s.content).join(' '));
    const qualityScore = calculateQualityScore(cleanedSections);

    const draft = new KnowledgeItem({
      title,
      category,
      sections: cleanedSections,
      relationships: [],
      source,
      metadata: {
        topic: metadata.topic || 'General',
        tags: metadata.tags || [],
        keywords: metadata.keywords || [],
        qualityScore,
        language: metadata.language || 'en'
      },
      status: 'Draft' as const,
      version: 1,
      createdById: user.id,
      createdByName: user.role
    });

    await draft.save();

    await AuditLog.create({
      userId: user.id,
      action: 'knowledge:draft_create',
      resource: draft._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(201).json({ message: 'Knowledge draft created', knowledgeItem: draft });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error saving draft', details: err.message });
  }
};

export const updateKnowledgeDraft = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, sections, relationships, metadata } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const item = await KnowledgeItem.findById(id);
    if (!item || item.status !== 'Draft') {
      return res.status(400).json({ error: 'Knowledge asset not found or not in draft state' });
    }

    const cleanedSections = (sections || []).map((sec: any) => ({
      heading: sec.heading,
      subheading: sec.subheading,
      content: cleanTextSegment(sec.content),
      contentType: sec.contentType || 'paragraph'
    }));

    const qualityScore = calculateQualityScore(cleanedSections);

    item.title = title || item.title;
    item.sections = cleanedSections;
    item.relationships = relationships || item.relationships;
    item.metadata = {
      topic: metadata.topic || item.metadata.topic,
      tags: metadata.tags || item.metadata.tags,
      keywords: metadata.keywords || item.metadata.keywords,
      qualityScore,
      language: metadata.language || item.metadata.language
    };

    await item.save();

    await AuditLog.create({
      userId: user.id,
      action: 'knowledge:draft_update',
      resource: item._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Knowledge draft updated', knowledgeItem: item });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during update' });
  }
};

export const submitReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const item = await KnowledgeItem.findById(id);
    if (!item || item.status !== 'Draft') {
      return res.status(400).json({ error: 'Asset not found or not in draft state' });
    }

    item.status = 'Pending Review';
    await item.save();

    await AuditLog.create({
      userId: user.id,
      action: 'knowledge:submit_review',
      resource: item._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Knowledge asset submitted for review', knowledgeItem: item });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during submission' });
  }
};

export const approveKnowledge = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const item = await KnowledgeItem.findById(id);
    if (!item || item.status !== 'Pending Review') {
      return res.status(400).json({ error: 'Asset not pending review' });
    }

    item.status = 'Approved';
    await item.save();

    await AuditLog.create({
      userId: user.id,
      action: 'knowledge:approve',
      resource: item._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Knowledge asset approved', knowledgeItem: item });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during approval' });
  }
};

export const publishKnowledge = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const item = await KnowledgeItem.findById(id);
    if (!item || item.status !== 'Approved') {
      return res.status(400).json({ error: 'Asset not approved yet' });
    }

    // Archive previous published version
    await KnowledgeItem.updateMany({ _id: { $ne: item._id }, title: item.title, status: 'Published' }, { status: 'Archived' });

    item.status = 'Published';
    await item.save();

    // Create snapshot
    const snapshot = new KnowledgeVersion({
      knowledgeId: item._id,
      version: item.version,
      title: item.title,
      category: item.category,
      sections: item.sections,
      relationships: item.relationships,
      metadata: item.metadata,
      createdById: user.id,
      createdByName: user.role
    });

    await snapshot.save();

    // Trigger AI sync events (Kafka or Redis pub/sub)
    // E.g., emitter.emit('knowledge:published', { knowledgeId: item._id });

    await AuditLog.create({
      userId: user.id,
      action: 'knowledge:publish',
      resource: item._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Published knowledge asset version ${item.version}`
    });

    return res.status(200).json({ message: 'Knowledge asset published successfully', knowledgeItem: item });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during publication' });
  }
};

export const getGraphRelationships = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const item = await KnowledgeItem.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Knowledge asset not found' });
    }

    // Build Graph Node links output format (Nodes and Edges)
    const nodes = [
      { id: item._id.toString(), label: item.title, type: 'source', category: item.category }
    ];

    const edges = item.relationships.map((rel) => {
      nodes.push({
        id: rel.targetItemId.toString(),
        label: rel.targetItemTitle,
        type: 'target',
        category: 'General'
      });

      return {
        source: item._id.toString(),
        target: rel.targetItemId.toString(),
        label: rel.type
      };
    });

    return res.status(200).json({ nodes, edges });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error building relationships graph mapping' });
  }
};

export const searchKnowledge = async (req: AuthenticatedRequest, res: Response) => {
  const { q, category, topic } = req.query;

  try {
    const query: any = { status: 'Published' };

    if (q) {
      query.$text = { $search: q as string };
    }
    if (category) {
      query.category = category;
    }
    if (topic) {
      query['metadata.topic'] = topic;
    }

    const items = await KnowledgeItem.find(query).sort({ updatedAt: -1 });
    return res.status(200).json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error executing search' });
  }
};
