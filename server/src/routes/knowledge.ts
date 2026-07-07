import { Router } from 'express';
import { body } from 'express-validator';
import {
  createKnowledgeDraft,
  updateKnowledgeDraft,
  submitReview,
  approveKnowledge,
  publishKnowledge,
  getGraphRelationships,
  searchKnowledge
} from '../controllers/knowledge';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

const draftValidator = [
  body('title').trim().notEmpty().withMessage('Title parameter is required'),
  body('sections').isArray({ min: 1 }).withMessage('Knowledge item must contain at least one content section'),
  body('source.sourceType').isIn(['Profile', 'Document', 'Crawler']).withMessage('Invalid source type selection'),
  body('source.sourceId').notEmpty().withMessage('Source ID is required'),
  body('metadata.topic').trim().notEmpty().withMessage('Topic is required'),
  validateRequest
];

// Public search and graph mapping routes
router.get('/search', authenticate as any, searchKnowledge as any);
router.get('/:id/graph', authenticate as any, getGraphRelationships as any);

// Editor operations routes
router.post(
  '/draft',
  authenticate as any,
  requireRole('Employee') as any,
  draftValidator,
  createKnowledgeDraft as any
);

router.put(
  '/:id',
  authenticate as any,
  requireRole('Employee') as any,
  draftValidator,
  updateKnowledgeDraft as any
);

router.post(
  '/:id/submit-review',
  authenticate as any,
  requireRole('Employee') as any,
  submitReview as any
);

// Reviewer and Admin routes
router.post(
  '/:id/approve',
  authenticate as any,
  requireRole('Manager') as any,
  approveKnowledge as any
);

router.post(
  '/:id/publish',
  authenticate as any,
  requireRole('Administrator') as any,
  publishKnowledge as any
);

export default router;
