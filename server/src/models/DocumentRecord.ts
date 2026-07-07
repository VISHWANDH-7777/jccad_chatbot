import mongoose, { Schema, Document } from 'mongoose';
import { DocumentMetadata, DocumentApprovalHistory, DocumentStatus } from '../../../shared/types/document';

export interface IDocumentRecordDocument extends Document {
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  storageKey: string;
  version: number;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  approvalHistory: DocumentApprovalHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentMetadataSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  tags: [{ type: String }],
  keywords: [{ type: String }],
  language: { type: String, required: true, default: 'en' },
  visibility: { type: String, enum: ['Public', 'Internal', 'Restricted'], required: true, default: 'Internal' },
  retentionPolicy: { type: String, required: true },
  expirationDate: { type: Date, required: false }
});

const DocumentRecordSchema: Schema<IDocumentRecordDocument> = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    checksum: {
      type: String,
      required: true,
      unique: true
    },
    storageKey: {
      type: String,
      required: true
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Review', 'Approved', 'Published', 'Archived'],
      required: true,
      default: 'Draft'
    },
    metadata: {
      type: DocumentMetadataSchema,
      required: true
    },
    approvalHistory: [
      {
        status: { type: String, required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
DocumentRecordSchema.index({ status: 1 });
DocumentRecordSchema.index({ 'metadata.category': 1 });
DocumentRecordSchema.index({ 'metadata.tags': 1 });
DocumentRecordSchema.index({ 'metadata.title': 'text', 'metadata.description': 'text' });

export const DocumentRecord = mongoose.model<IDocumentRecordDocument>('DocumentRecord', DocumentRecordSchema);
