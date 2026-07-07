import { Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { DocumentRecord } from '../models/DocumentRecord';
import { DocumentVersion } from '../models/DocumentVersion';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { DocumentMetadata } from '../../../shared/types/document';

// List of allowed document MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'text/plain',
  'text/markdown',
  'text/html',
  'image/png',
  'image/jpeg'
];

export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Clean up local temp file
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: `File type ${file.mimetype} is not supported` });
  }

  try {
    // Generate file SHA256 checksum to detect duplicates
    const fileBuffer = fs.readFileSync(file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const duplicate = await DocumentRecord.findOne({ checksum });
    if (duplicate) {
      fs.unlinkSync(file.path);
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_FILE',
          message: 'This document has already been uploaded to the platform',
          duplicateId: duplicate._id
        }
      });
    }

    // Default metadata block
    const metadata: DocumentMetadata = {
      title: req.body.title || file.originalname,
      description: req.body.description || 'Uploaded via Document Intelligence Platform',
      author: req.body.author || user.role,
      ownerId: user.id,
      department: req.body.department || 'General',
      category: req.body.category || 'General',
      tags: req.body.tags ? req.body.tags.split(',') : [],
      keywords: req.body.keywords ? req.body.keywords.split(',') : [],
      language: req.body.language || 'en',
      visibility: req.body.visibility || 'Internal',
      retentionPolicy: req.body.retentionPolicy || 'Indefinite'
    };

    const docRecord = new DocumentRecord({
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      checksum,
      storageKey: file.path, // In production, this would represent the S3 bucket key path
      version: 1,
      status: 'Draft' as const,
      metadata,
      approvalHistory: [
        {
          status: 'Draft',
          actorId: user.id,
          actorName: user.role,
          notes: 'Uploaded document draft'
        }
      ]
    });

    await docRecord.save();

    await AuditLog.create({
      userId: user.id,
      action: 'document:upload',
      resource: docRecord._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(201).json({ message: 'Document uploaded successfully', document: docRecord });
  } catch (err: any) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ error: 'Server error during upload process', details: err.message });
  }
};

export const submitReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const doc = await DocumentRecord.findById(id);
    if (!doc || doc.status !== 'Draft') {
      return res.status(400).json({ error: 'Document not found or not in draft state' });
    }

    doc.status = 'Pending Review';
    doc.approvalHistory.push({
      status: 'Pending Review',
      actorId: user.id,
      actorName: user.role,
      notes: 'Submitted for document review workflow',
      timestamp: new Date().toISOString()
    });

    await doc.save();

    await AuditLog.create({
      userId: user.id,
      action: 'document:submit_review',
      resource: doc._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Document submitted for review', document: doc });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during submission' });
  }
};

export const approveDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const doc = await DocumentRecord.findById(id);
    if (!doc || doc.status !== 'Pending Review') {
      return res.status(400).json({ error: 'Document not found or not pending review' });
    }

    doc.status = 'Approved';
    doc.approvalHistory.push({
      status: 'Approved',
      actorId: user.id,
      actorName: user.role,
      notes: notes || 'Document approved for publish',
      timestamp: new Date().toISOString()
    });

    await doc.save();

    await AuditLog.create({
      userId: user.id,
      action: 'document:approve',
      resource: doc._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Document version approved', document: doc });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during approval' });
  }
};

export const publishDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const doc = await DocumentRecord.findById(id);
    if (!doc || doc.status !== 'Approved') {
      return res.status(400).json({ error: 'Document not found or not approved yet' });
    }

    doc.status = 'Published';
    doc.approvalHistory.push({
      status: 'Published',
      actorId: user.id,
      actorName: user.role,
      notes: 'Published document version to active knowledge caches',
      timestamp: new Date().toISOString()
    });

    await doc.save();

    // Capture historical snapshot version
    const versionSnapshot = new DocumentVersion({
      documentId: doc._id,
      version: doc.version,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      checksum: doc.checksum,
      storageKey: doc.storageKey,
      metadata: doc.metadata,
      createdById: user.id,
      createdByName: user.role
    });

    await versionSnapshot.save();

    // Trigger AI Synchronization events.
    // In a production system, we would publish an event (e.g., to Redis Pub/Sub or Kafka):
    // E.g., emitter.emit('document:published', { documentId: doc._id, storageKey: doc.storageKey });

    await AuditLog.create({
      userId: user.id,
      action: 'document:publish',
      resource: doc._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Published document version ${doc.version}`
    });

    return res.status(200).json({ message: 'Document published successfully', document: doc });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during publication' });
  }
};

export const searchDocuments = async (req: AuthenticatedRequest, res: Response) => {
  const { q, category, tag, status } = req.query;

  try {
    const query: any = {};

    if (q) {
      query.$text = { $search: q as string };
    }
    if (category) {
      query['metadata.category'] = category;
    }
    if (tag) {
      query['metadata.tags'] = tag;
    }
    if (status) {
      query.status = status;
    } else {
      // By default, restrict searches to Published documents
      query.status = 'Published';
    }

    const documents = await DocumentRecord.find(query).sort({ updatedAt: -1 });
    return res.status(200).json({ documents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error executing document search' });
  }
};

export const downloadDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const doc = await DocumentRecord.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify user role levels for visibility configurations
    if (doc.metadata.visibility === 'Restricted' && req.user!.role !== 'Administrator' && req.user!.role !== 'Super Administrator') {
      return res.status(403).json({ error: 'Unauthorized to download restricted documents' });
    }

    if (!fs.existsSync(doc.storageKey)) {
      return res.status(404).json({ error: 'Physical document file not found in storage' });
    }

    return res.download(doc.storageKey, doc.fileName);
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error downloading file' });
  }
};
