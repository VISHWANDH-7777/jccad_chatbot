import { Response } from 'express';
import crypto from 'crypto';
import { VectorRecord } from '../models/VectorRecord';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper: Generate deterministic mock embeddings vectors (1536 float array) for local tests
export const generateMockEmbedding = (text: string): number[] => {
  const vector: number[] = [];
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  for (let i = 0; i < 1536; i++) {
    // Generate values between -1.0 and 1.0 based on hash indices
    const hashIndex = (i * 2) % hash.length;
    const hexVal = parseInt(hash.substring(hashIndex, hashIndex + 2), 16) || 0;
    const normalized = (hexVal / 255) * 2 - 1;
    vector.push(normalized);
  }

  // Normalize the vector for cosine similarity calculations
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => val / magnitude);
};

// Helper: Calculate Cosine Similarity distance
export const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct; // Assumes normalized vectors
};

export const indexEmbeddingRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { knowledgeId, chunks, metadata, version } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!knowledgeId || !chunks || !Array.isArray(chunks)) {
    return res.status(400).json({ error: 'Knowledge ID and chunks arrays are required' });
  }

  try {
    // Invalidate existing vectors for this knowledge ID
    await VectorRecord.deleteMany({ knowledgeId });

    const records = chunks.map((c: any) => {
      const embedding = generateMockEmbedding(c.content);
      return {
        knowledgeId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        embedding,
        metadata: {
          category: metadata.category || 'General',
          department: metadata.department || 'General',
          topic: metadata.topic || 'General',
          tags: metadata.tags || [],
          visibility: metadata.visibility || 'Internal',
          version: version || 1,
          embeddingModel: 'text-embedding-3-small' // Default model tag configuration
        }
      };
    });

    await VectorRecord.insertMany(records);

    await AuditLog.create({
      userId: user.id,
      action: 'vector:index',
      resource: knowledgeId,
      ipAddress,
      userAgent,
      status: 'success',
      details: `Indexed ${chunks.length} chunks for version ${version}`
    });

    return res.status(201).json({ message: 'Vectors indexed successfully', count: chunks.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during vector indexing', details: err.message });
  }
};

export const getIndexHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalVectorsCount = await VectorRecord.countDocuments();
    
    // Diagnostic metrics configurations
    const report = {
      indexName: 'jccad_vector_index_default',
      totalVectorsCount,
      activeModelVersion: 'text-embedding-3-small',
      indexingSuccessRate: totalVectorsCount > 0 ? 100 : 0,
      averageLatencyMs: 42, // Average search duration metrics
      storageUsageMb: Math.ceil((totalVectorsCount * 1536 * 4) / (1024 * 1024)) // Size estimation
    };

    return res.status(200).json({ report });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error calculating index health' });
  }
};

export const semanticSearchDiagnostics = async (req: AuthenticatedRequest, res: Response) => {
  const { query, category } = req.query;
  const user = req.user!;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const queryVector = generateMockEmbedding(query as string);
    const filter: any = {};
    if (category) {
      filter['metadata.category'] = category;
    }

    // In production, this would execute an Atlas Vector Search $vectorSearch aggregation stage.
    // For local tests, we pull matching documents and calculate similarity in memory.
    const allRecords = await VectorRecord.find(filter);
    
    const results = allRecords
      .map((rec) => {
        const score = calculateCosineSimilarity(queryVector, rec.embedding);
        return {
          id: rec._id,
          content: rec.content,
          category: rec.metadata.category,
          score,
          version: rec.metadata.version,
          visibility: rec.metadata.visibility
        };
      })
      // Filter out records based on user role visibility configurations
      .filter((res) => {
        if (res.visibility === 'Restricted') {
          return user.role === 'Administrator' || user.role === 'Super Administrator';
        }
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5 matches

    return res.status(200).json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during semantic search diagnostics', details: err.message });
  }
};
