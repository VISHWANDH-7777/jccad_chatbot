import mongoose, { Schema, Document } from 'mongoose';
import { PipelineStage, PipelineQualityReport, EmbeddingRequestPackage } from '../../../shared/types/pipeline';

export interface IPipelineJobDocument extends Document {
  knowledgeId: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStage: PipelineStage;
  errorLog?: string;
  qualityReport?: PipelineQualityReport;
  outputPackage?: EmbeddingRequestPackage;
  createdAt: Date;
  updatedAt: Date;
}

const QualityReportSchema = new Schema({
  completenessScore: { type: Number, required: true },
  readabilityScore: { type: Number, required: true },
  metadataQualityScore: { type: Number, required: true },
  structuralQualityScore: { type: Number, required: true },
  totalScore: { type: Number, required: true }
});

const ChunkDefinitionSchema = new Schema({
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  tokenCount: { type: Number, required: true },
  headingPath: [{ type: String }],
  checksum: { type: String, required: true }
});

const OutputPackageSchema = new Schema({
  jobId: { type: String, required: true },
  knowledgeId: { type: String, required: true },
  version: { type: Number, required: true },
  chunks: [ChunkDefinitionSchema],
  metadata: {
    category: { type: String, required: true },
    department: { type: String, required: true },
    topic: { type: String, required: true },
    tags: [{ type: String }],
    visibility: { type: String, enum: ['Public', 'Internal', 'Restricted'], required: true }
  },
  relationships: [
    {
      type: { type: String, required: true },
      targetItemId: { type: String, required: true }
    }
  ]
});

const PipelineJobSchema: Schema<IPipelineJobDocument> = new Schema(
  {
    knowledgeId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeItem',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      required: true,
      default: 'pending'
    },
    currentStage: {
      type: String,
      enum: ['Validation', 'Canonicalization', 'Chunking', 'Enrichment', 'Completed', 'Failed'],
      required: true,
      default: 'Validation'
    },
    errorLog: {
      type: String,
      required: false
    },
    qualityReport: {
      type: QualityReportSchema,
      required: false
    },
    outputPackage: {
      type: OutputPackageSchema,
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
PipelineJobSchema.index({ status: 1 });
PipelineJobSchema.index({ currentStage: 1 });

export const PipelineJob = mongoose.model<IPipelineJobDocument>('PipelineJob', PipelineJobSchema);
