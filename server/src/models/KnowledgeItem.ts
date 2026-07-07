import mongoose, { Schema, Document } from 'mongoose';
import { KnowledgeCategory, KnowledgeStatus, KnowledgeSection, KnowledgeRelationship, KnowledgeSourceRef, KnowledgeMetadata } from '../../../shared/types/knowledge';

export interface IKnowledgeItemDocument extends Document {
  title: string;
  category: KnowledgeCategory;
  sections: KnowledgeSection[];
  relationships: KnowledgeRelationship[];
  source: KnowledgeSourceRef;
  metadata: KnowledgeMetadata;
  status: KnowledgeStatus;
  version: number;
  createdById: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeSectionSchema = new Schema({
  heading: { type: String, required: true, trim: true },
  subheading: { type: String, required: false, trim: true },
  content: { type: String, required: true, trim: true },
  contentType: { type: String, enum: ['paragraph', 'list', 'table', 'definition'], required: true, default: 'paragraph' }
});

const KnowledgeRelationshipSchema = new Schema({
  type: { type: String, enum: ['belongs_to', 'relates_to', 'prerequisite_of', 'taught_by'], required: true },
  targetItemId: { type: Schema.Types.ObjectId, ref: 'KnowledgeItem', required: true },
  targetItemTitle: { type: String, required: true }
});

const KnowledgeSourceRefSchema = new Schema({
  sourceType: { type: String, enum: ['Profile', 'Document', 'Crawler'], required: true },
  sourceId: { type: String, required: true },
  sourceVersion: { type: Number, required: true }
});

const KnowledgeMetadataSchema = new Schema({
  topic: { type: String, required: true, trim: true },
  tags: [{ type: String }],
  keywords: [{ type: String }],
  qualityScore: { type: Number, required: true, min: 0, max: 100, default: 100 },
  language: { type: String, required: true, default: 'en' }
});

const KnowledgeItemSchema: Schema<IKnowledgeItemDocument> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Company Profile', 'Departments', 'Services', 'Courses', 'Internships', 'Workshops', 'Policies', 'FAQs', 'Engineering Domains', 'Research', 'Announcements', 'Support', 'General']
    },
    sections: [KnowledgeSectionSchema],
    relationships: [KnowledgeRelationshipSchema],
    source: {
      type: KnowledgeSourceRefSchema,
      required: true
    },
    metadata: {
      type: KnowledgeMetadataSchema,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Pending Review', 'Approved', 'Published', 'Archived'],
      default: 'Draft'
    },
    version: {
      type: Number,
      required: true,
      default: 1
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
    timestamps: true
  }
);

// Indexes for RAG searches
KnowledgeItemSchema.index({ status: 1 });
KnowledgeItemSchema.index({ category: 1 });
KnowledgeItemSchema.index({ 'relationships.targetItemId': 1 });
KnowledgeItemSchema.index({ title: 'text', 'sections.content': 'text' });

export const KnowledgeItem = mongoose.model<IKnowledgeItemDocument>('KnowledgeItem', KnowledgeItemSchema);
