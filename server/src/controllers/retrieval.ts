import { Response } from 'express';
import { VectorRecord } from '../models/VectorRecord';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { QueryIntent, RetrievalResult } from '../../../shared/types/retrieval';
import { generateMockEmbedding, calculateCosineSimilarity } from './vector';

// Simple In-memory Retrieval Cache to optimize search performance
const searchCache = new Map<string, { timestamp: number; payload: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes

// Intent Parser Engine
export const detectQueryIntent = (query: string): QueryIntent => {
  const normalized = query.toLowerCase().trim();

  // 1. Check for Greetings with word boundaries to avoid false substring matching (e.g. 'they' matching 'hey')
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
  if (greetings.some(g => normalized === g || normalized.startsWith(g + ' ') || new RegExp('\\b' + g + '\\b').test(normalized))) {
    return 'Greeting';
  }

  // 2. Check for JCCAD/Company related queries (including software, services, target audience, synonyms, etc.)
  const jccadKeywords = [
    'jccad', 'jccadsoftsol', 'jccad.in',
    'cad training', 'cad course', 'cad classes', 'engineering training',
    'autocad', 'catia', 'solidworks', 'siemens nx', 'nx', 'ptc creo', 'creo', 'fusion 360', 'ansys',
    'internship', 'internships', 'corporate training', 'engineering design', 'consultancy',
    'services', 'software', 'industries', 'mission', 'vision', 'tagline', 'contact', 'email', 'website',
    'hours', 'syllabus', 'drone', 'uav', 'workshop', 'workshops', 'mechanical', 'automotive', 'manufacturing',
    'students', 'professionals', 'startups', 'institutions', 'companies', 'provide', 'offer', 'teach',
    'target', 'customer', 'customers', 'audience', 'audiences', 'client', 'clients', 'serve'
  ];

  if (jccadKeywords.some(keyword => normalized.includes(keyword))) {
    return 'CompanyQuery';
  }

  // 3. Fallback to General AI
  return 'GeneralAI';
};

// Helper: Calculate lexical matching score between query and document content/metadata
const calculateLexicalScore = (query: string, content: string, category: string, metadata: any): number => {
  const normalizedQuery = query.toLowerCase();
  const normalizedContent = content.toLowerCase();
  
  const synonymGroups = [
    ['cad training', 'cad course', 'cad classes', 'autocad', 'solidworks', 'catia', 'nx', 'creo', 'fusion', 'ansys'],
    ['internship', 'internships', 'placement', 'program'],
    ['services', 'offerings', 'solutions', 'consultancy'],
    ['industries', 'automotive', 'mechanical', 'manufacturing', 'sectors', 'msmes', 'startups'],
    ['contact', 'email', 'website', 'support', 'gmail', 'phone', 'address']
  ];

  let matches = 0;
  let totalTerms = 0;

  const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);
  
  for (const group of synonymGroups) {
    const queryHasGroupTerm = group.some(term => normalizedQuery.includes(term));
    if (queryHasGroupTerm) {
      const contentHasGroupTerm = group.some(term => normalizedContent.includes(term));
      if (contentHasGroupTerm) {
        matches += 2.0;
      }
      totalTerms += 1;
    }
  }

  for (const term of queryTerms) {
    totalTerms++;
    if (normalizedContent.includes(term)) {
      matches += 1.0;
    }
    if (category.toLowerCase().includes(term) || 
        (metadata?.topic && metadata.topic.toLowerCase().includes(term)) ||
        (metadata?.tags && metadata.tags.some((t: string) => t.toLowerCase().includes(term))) ||
        (metadata?.keywords && metadata.keywords.some((k: string) => k.toLowerCase().includes(term)))) {
      matches += 0.5;
    }
  }

  return totalTerms > 0 ? Math.min(1.0, matches / totalTerms) : 0.0;
};

// Simple Reciprocal Rank Fusion (RRF) combiner (combining vector similarity, document quality, and lexical score)
export const calculateRrfScore = (cosineScore: number, qualityScore: number, lexicalScore = 0.5): number => {
  const blendedVectorScore = lexicalScore > 0 ? (cosineScore * 0.4 + lexicalScore * 0.6) : cosineScore;
  const vectorWeight = 0.7;
  const qualityWeight = 0.3;
  return (blendedVectorScore * vectorWeight) + ((qualityScore / 100) * qualityWeight);
};

export const searchRetrieval = async (req: AuthenticatedRequest, res: Response) => {
  const { q, category } = req.query;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!q) {
    return res.status(400).json({ error: 'Search query parameter is required' });
  }

  // Check cache before querying database
  const cacheKey = `${user.role}:${category || 'All'}:${q}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.status(200).json(cached.payload);
  }

  try {
    const queryText = q as string;
    const intent = detectQueryIntent(queryText);

    if (intent === 'Greeting') {
      return res.status(200).json({
        query: queryText,
        intent,
        contextChunks: [],
        citations: [],
        totalTokensUsed: 0
      });
    }

    const queryVector = generateMockEmbedding(queryText);
    const filter: any = {};
    if (category) {
      filter['metadata.category'] = category;
    }

    const allRecords = await VectorRecord.find(filter);

    const retrievalMatches = allRecords
      .map((rec) => {
        const cosineScore = calculateCosineSimilarity(queryVector, rec.embedding);
        const lexicalScore = calculateLexicalScore(queryText, rec.content, rec.metadata.category, rec.metadata);
        const qualityScore = rec.metadata.version * 20 + 50; // Dynamic quality metric calculation
        const rrfScore = calculateRrfScore(cosineScore, qualityScore, lexicalScore);

        return {
          chunkId: rec._id.toString(),
          content: rec.content,
          category: rec.metadata.category,
          score: rrfScore,
          vectorScore: cosineScore,
          lexicalScore,
          metadata: {
            visibility: rec.metadata.visibility,
            version: rec.metadata.version,
            qualityScore
          }
        };
      })
      // Enforce permission-aware visibility boundaries
      .filter((m) => {
        if (m.metadata.visibility === 'Restricted') {
          return user.role === 'Administrator' || user.role === 'Super Administrator';
        }
        return true;
      })
      .sort((a, b) => b.score - a.score);

    // Limit context length using token budget constraints (1500 tokens approx.)
    let tokenAccumulator = 0;
    const contextChunks: RetrievalResult[] = [];
    const citations: any[] = [];

    for (const match of retrievalMatches) {
      // Estimate token count of content (approx. 4 characters = 1 token)
      const tokenCount = Math.ceil(match.content.length / 4);
      if (tokenAccumulator + tokenCount > 1500) {
        break; // Token budget exceeded
      }

      tokenAccumulator += tokenCount;
      contextChunks.push(match);

      citations.push({
        citationIndex: contextChunks.length,
        chunkId: match.chunkId,
        sourceName: `${match.category} Document`,
        version: match.metadata.version
      });
    }

    const responsePayload = {
      query: queryText,
      intent,
      contextChunks,
      citations,
      totalTokensUsed: tokenAccumulator
    };

    // Save in cache
    searchCache.set(cacheKey, { timestamp: Date.now(), payload: responsePayload });

    await AuditLog.create({
      userId: user.id,
      action: 'retrieval:search',
      resource: queryText.substring(0, 100),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Intent: ${intent}. Found ${contextChunks.length} chunks within token budget.`
    });

    return res.status(200).json(responsePayload);
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during search retrieval', details: err.message });
  }
};
