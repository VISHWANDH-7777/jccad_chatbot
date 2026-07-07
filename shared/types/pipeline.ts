export type PipelineStage = 'Validation' | 'Canonicalization' | 'Chunking' | 'Enrichment' | 'Completed' | 'Failed';

export interface ChunkDefinition {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  headingPath: string[]; // List of headings preserving nesting
  checksum: string;
}

export interface PipelineQualityReport {
  completenessScore: number;
  readabilityScore: number;
  metadataQualityScore: number;
  structuralQualityScore: number;
  totalScore: number; // Combined quality score (0-100)
}

export interface EmbeddingRequestPackage {
  jobId: string;
  knowledgeId: string;
  version: number;
  chunks: ChunkDefinition[];
  metadata: {
    category: string;
    department: string;
    topic: string;
    tags: string[];
    visibility: 'Public' | 'Internal' | 'Restricted';
  };
  relationships: Array<{
    type: string;
    targetItemId: string;
  }>;
}

export interface PipelineJob {
  id: string;
  knowledgeId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStage: PipelineStage;
  errorLog?: string;
  qualityReport?: PipelineQualityReport;
  outputPackage?: EmbeddingRequestPackage;
  createdAt: string;
  updatedAt: string;
}
