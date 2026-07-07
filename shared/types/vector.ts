export interface VectorRecord {
  id: string;
  knowledgeId: string;
  chunkIndex: number;
  content: string;
  embedding: number[]; // 1536-dimension float array
  metadata: {
    category: string;
    department: string;
    topic: string;
    tags: string[];
    visibility: 'Public' | 'Internal' | 'Restricted';
    version: number;
    embeddingModel: string;
  };
  createdAt: string;
}

export interface IndexHealthReport {
  indexName: string;
  totalVectorsCount: number;
  activeModelVersion: string;
  indexingSuccessRate: number;
  averageLatencyMs: number;
  storageUsageMb: number;
}

export interface ReindexJob {
  id: string;
  status: 'pending' | 'indexing' | 'completed' | 'failed';
  totalChunks: number;
  processedChunks: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
