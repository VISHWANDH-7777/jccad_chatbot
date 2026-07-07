import { Router } from 'express';
import { body, query } from 'express-validator';
import { indexEmbeddingRequest, getIndexHealth, semanticSearchDiagnostics } from '../controllers/vector';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

router.post(
  '/index',
  authenticate as any,
  requireRole('Employee') as any,
  [
    body('knowledgeId').isMongoId().withMessage('Invalid Knowledge mongo ID parameter'),
    body('chunks').isArray({ min: 1 }).withMessage('Chunks array cannot be empty'),
    body('metadata.category').notEmpty().withMessage('Category metadata tag is required'),
    validateRequest
  ],
  indexEmbeddingRequest as any
);

router.get(
  '/health',
  authenticate as any,
  requireRole('Employee') as any,
  getIndexHealth as any
);

router.get(
  '/search-diagnostics',
  authenticate as any,
  [
    query('query').trim().notEmpty().withMessage('Search query text cannot be empty'),
    validateRequest
  ],
  semanticSearchDiagnostics as any
);

export default router;
