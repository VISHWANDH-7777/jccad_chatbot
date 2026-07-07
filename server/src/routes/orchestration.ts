import { Router } from 'express';
import { body } from 'express-validator';
import { streamChat, getConversationHistory } from '../controllers/orchestration';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

router.post(
  '/chat',
  authenticate as any,
  [
    body('query').trim().notEmpty().withMessage('Search query text cannot be empty'),
    body('conversationId').optional().isMongoId().withMessage('Invalid Conversation thread ID'),
    validateRequest
  ],
  streamChat as any
);

router.get(
  '/history',
  authenticate as any,
  getConversationHistory as any
);

export default router;
