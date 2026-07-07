import { Router } from 'express';
import { body } from 'express-validator';
import { triggerPipeline, getJobsList, getJobDetail } from '../controllers/pipeline';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

router.post(
  '/',
  authenticate as any,
  requireRole('Employee') as any,
  [
    body('knowledgeId').isMongoId().withMessage('Invalid Knowledge mongo ID parameter'),
    validateRequest
  ],
  triggerPipeline as any
);

router.get(
  '/',
  authenticate as any,
  requireRole('Employee') as any,
  getJobsList as any
);

router.get(
  '/:id',
  authenticate as any,
  requireRole('Employee') as any,
  getJobDetail as any
);

export default router;
