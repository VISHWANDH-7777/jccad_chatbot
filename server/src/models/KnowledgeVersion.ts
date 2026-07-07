import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeVersionDocument extends Document {
  knowledgeId: mongoose.Types.ObjectId;
  version: number;
  title: string;
  category: string;
  sections: any[];
  relationships: any[];
  metadata: any;
  createdById: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
}

const KnowledgeVersionSchema: Schema<IKnowledgeVersionDocument> = new Schema(
  {
    knowledgeId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeItem',
      required: true
    },
    version: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    sections: {
      type: Schema.Types.Mixed,
      required: true
    },
    relationships: {
      type: Schema.Types.Mixed,
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
KnowledgeVersionSchema.index({ knowledgeId: 1, version: 1 }, { unique: true });

export const KnowledgeVersion = mongoose.model<IKnowledgeVersionDocument>('KnowledgeVersion', KnowledgeVersionSchema);
