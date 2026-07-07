import mongoose, { Schema, Document } from 'mongoose';
import { DocumentMetadata } from '../../../shared/types/document';

export interface IDocumentVersionDocument extends Document {
  documentId: mongoose.Types.ObjectId;
  version: number;
  fileName: string;
  fileSize: number;
  checksum: string;
  storageKey: string;
  metadata: DocumentMetadata;
  createdById: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
}

const DocumentVersionSchema: Schema<IDocumentVersionDocument> = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentRecord',
      required: true
    },
    version: {
      type: Number,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    checksum: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
DocumentVersionSchema.index({ documentId: 1, version: 1 }, { unique: true });

export const DocumentVersion = mongoose.model<IDocumentVersionDocument>('DocumentVersion', DocumentVersionSchema);
