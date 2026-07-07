import { Router } from 'express';
import { body } from 'express-validator';
import { listAvailableTools, invokeTool } from '../controllers/tools';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

router.get(
  '/',
  authenticate as any,
  listAvailableTools as any
);

router.post(
  '/execute',
  authenticate as any,
  [
    body('toolName').trim().notEmpty().withMessage('Parameter toolName cannot be empty'),
    body('args').optional().isObject().withMessage('Arguments must represent a valid key-value parameters object'),
    validateRequest
  ],
  invokeTool as any
);

export default router;
