import { Router } from 'express';
import { query } from 'express-validator';
import { searchRetrieval } from '../controllers/retrieval';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

router.get(
  '/',
  authenticate as any,
  [
    query('q').trim().notEmpty().withMessage('Query search parameter cannot be empty'),
    validateRequest
  ],
  searchRetrieval as any
);

export default router;
