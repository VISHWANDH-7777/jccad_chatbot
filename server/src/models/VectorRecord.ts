import mongoose, { Schema, Document } from 'mongoose';

export interface IVectorRecordDocument extends Document {
  knowledgeId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[]; // Float array vector (e.g. 1536 dims for text-embedding-3-small)
  metadata: {
    category: string;
    department: string;
    topic: string;
    tags: string[];
    visibility: 'Public' | 'Internal' | 'Restricted';
    version: number;
    embeddingModel: string;
  };
  createdAt: Date;
}

const VectorRecordSchema: Schema<IVectorRecordDocument> = new Schema(
  {
    knowledgeId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeItem',
      required: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number], // Float vector field
      required: true
    },
    metadata: {
      category: { type: String, required: true },
      department: { type: String, required: true },
      topic: { type: String, required: true },
      tags: [{ type: String }],
      visibility: { type: String, enum: ['Public', 'Internal', 'Restricted'], required: true },
      version: { type: Number, required: true },
      embeddingModel: { type: String, required: true }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
VectorRecordSchema.index({ knowledgeId: 1 });
VectorRecordSchema.index({ 'metadata.category': 1 });
VectorRecordSchema.index({ 'metadata.visibility': 1 });

// Atlas Search compatibility indices configurations
// We define vector indices mapping fields to support cosine search paths
// E.g.:
// {
//   "mappings": {
//     "dynamic": true,
//     "fields": {
//       "embedding": {
//         "dimensions": 1536,
//         "similarity": "cosine",
//         "type": "knnVector"
//       }
//     }
//   }
// }

export const VectorRecord = mongoose.model<IVectorRecordDocument>('VectorRecord', VectorRecordSchema);
