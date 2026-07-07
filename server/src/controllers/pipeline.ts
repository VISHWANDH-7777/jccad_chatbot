import { Response } from 'express';
import crypto from 'crypto';
import { PipelineJob } from '../models/PipelineJob';
import { KnowledgeItem } from '../models/KnowledgeItem';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { ChunkDefinition, PipelineQualityReport } from '../../../shared/types/pipeline';

// Helper: Estimate token count using average word character counts (approx. 4 characters = 1 token)
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

// Implements text chunking strategy: splits text to maximum 512 tokens with 64 token overlap
export const planChunks = (text: string, maxTokens = 512, overlapTokens = 64): string[] => {
  if (!text) return [];

  const words = text.split(/\s+/);
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordTokens = estimateTokens(word) + 1; // Add space token estimation

    if (currentTokens + wordTokens > maxTokens) {
      chunks.push(currentChunk);

      // Backtrack index to handle overlap strategy
      const backtrackWords: string[] = [];
      let overlapCount = 0;
      let j = currentChunk.length - 1;

      while (j >= 0 && overlapCount < overlapTokens) {
        const backWord = currentChunk[j];
        overlapCount += estimateTokens(backWord) + 1;
        backtrackWords.unshift(backWord);
        j--;
      }

      currentChunk = [...backtrackWords];
      currentTokens = overlapCount;
    }

    currentChunk.push(word);
    currentTokens += wordTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.map((c) => c.join(' '));
};

export const triggerPipeline = async (req: AuthenticatedRequest, res: Response) => {
  const { knowledgeId } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!knowledgeId) {
    return res.status(400).json({ error: 'Target Knowledge ID is required' });
  }

  try {
    const knowledge = await KnowledgeItem.findById(knowledgeId);
    if (!knowledge || knowledge.status !== 'Published') {
      return res.status(400).json({ error: 'Knowledge asset not found or not in Published state' });
    }

    // Initialize pipeline job state
    const job = new PipelineJob({
      knowledgeId: knowledge._id,
      status: 'pending',
      currentStage: 'Validation'
    });

    await job.save();

    await AuditLog.create({
      userId: user.id,
      action: 'pipeline:trigger',
      resource: job._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    // Execute processing task synchronously for local execution tests
    await executePipelineWorkflow(job._id.toString(), knowledgeId);

    const updatedJob = await PipelineJob.findById(job._id);
    return res.status(202).json({ message: 'Pipeline process completed', job: updatedJob });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error triggering pipeline', details: err.message });
  }
};

const executePipelineWorkflow = async (jobId: string, knowledgeId: string) => {
  const job = await PipelineJob.findById(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.currentStage = 'Validation';
    await job.save();

    const knowledge = await KnowledgeItem.findById(knowledgeId);
    if (!knowledge) {
      throw new Error('Knowledge asset not found during processing');
    }

    // Canonicalization Stage
    job.currentStage = 'Canonicalization';
    await job.save();
    
    // Compile headings and sections into a single markdown string
    const canonicalText = knowledge.sections
      .map((sec) => `# ${sec.heading}\n\n${sec.content}`)
      .join('\n\n');

    // Chunking Stage
    job.currentStage = 'Chunking';
    await job.save();

    const rawChunks = planChunks(canonicalText);
    const chunks: ChunkDefinition[] = rawChunks.map((content, idx) => {
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      return {
        chunkIndex: idx,
        content,
        tokenCount: estimateTokens(content),
        headingPath: [knowledge.title],
        checksum
      };
    });

    // Enrichment Stage
    job.currentStage = 'Enrichment';
    await job.save();

    const qualityReport: PipelineQualityReport = {
      completenessScore: knowledge.metadata.qualityScore,
      readabilityScore: 95, // Default calculation check
      metadataQualityScore: knowledge.metadata.tags.length > 0 ? 100 : 80,
      structuralQualityScore: knowledge.sections.length > 0 ? 100 : 70,
      totalScore: Math.ceil((knowledge.metadata.qualityScore + 95) / 2)
    };

    const outputPackage = {
      jobId,
      knowledgeId: knowledge._id.toString(),
      version: knowledge.version,
      chunks,
      metadata: {
        category: knowledge.category,
        department: 'Engineering', // Default fallback
        topic: knowledge.metadata.topic,
        tags: knowledge.metadata.tags,
        visibility: 'Internal' as const
      },
      relationships: knowledge.relationships.map((r) => ({
        type: r.type,
        targetItemId: r.targetItemId.toString()
      }))
    };

    job.status = 'completed';
    job.currentStage = 'Completed';
    job.qualityReport = qualityReport;
    job.outputPackage = outputPackage;
    await job.save();

  } catch (err: any) {
    job.status = 'failed';
    job.currentStage = 'Failed';
    job.errorLog = err.message || 'Pipeline workflow error';
    await job.save();
  }
};

export const getJobsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await PipelineJob.find().populate('knowledgeId').sort({ createdAt: -1 });
    return res.status(200).json({ jobs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error retrieving jobs' });
  }
};

export const getJobDetail = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const job = await PipelineJob.findById(id).populate('knowledgeId');
    if (!job) {
      return res.status(404).json({ error: 'Pipeline job not found' });
    }
    return res.status(200).json({ job });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error fetching job details' });
  }
};
