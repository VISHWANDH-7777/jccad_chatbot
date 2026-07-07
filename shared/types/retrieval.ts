import { UserRole } from './auth';

export type QueryIntent = 'Greeting' | 'CompanyQuery' | 'GeneralAI' | 'Unsupported';

export interface RetrievalResult {
  chunkId: string;
  content: string;
  category: string;
  score: number; // Combined hybrid rank score
  vectorScore: number;
  lexicalScore: number;
  metadata: {
    visibility: 'Public' | 'Internal' | 'Restricted';
    version: number;
    qualityScore: number;
  };
}

export interface GroundedContextPackage {
  query: string;
  intent: QueryIntent;
  contextChunks: RetrievalResult[];
  citations: Array<{
    citationIndex: number;
    chunkId: string;
    sourceName: string;
    version: number;
  }>;
  totalTokensUsed: number;
}
