import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublished,
  getLatest,
  updateDraft,
  submitForReview,
  approve,
  publish,
  reject,
  getVersions,
  rollback
} from '../controllers/profile';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

const draftValidator = [
  body('data.companyName').trim().notEmpty().withMessage('Company Name is required'),
  body('data.tagline').trim().notEmpty().withMessage('Tagline is required'),
  body('data.aboutUs').trim().notEmpty().withMessage('About Us summary is required'),
  body('data.mission').trim().notEmpty().withMessage('Mission is required'),
  body('data.vision').trim().notEmpty().withMessage('Vision is required'),
  body('data.organizationType').trim().notEmpty().withMessage('Organization Type is required'),
  body('data.contactEmail').isEmail().withMessage('Enter a valid contact email address'),
  body('data.contactPhone').trim().notEmpty().withMessage('Contact phone number is required'),
  body('data.websiteUrl').isURL().withMessage('Enter a valid website URL'),
  body('data.workingHours').trim().notEmpty().withMessage('Working hours description is required'),
  validateRequest
];

// Public Endpoints
router.get('/published', getPublished);

// Internal Auth Protected Endpoints
router.get('/latest', authenticate as any, requireRole('Employee') as any, getLatest);
router.get('/versions', authenticate as any, requireRole('Employee') as any, getVersions);

router.post(
  '/draft',
  authenticate as any,
  requireRole('Employee') as any,
  draftValidator,
  updateDraft as any
);

router.post(
  '/submit-review',
  authenticate as any,
  requireRole('Employee') as any,
  submitForReview as any
);

router.post(
  '/approve',
  authenticate as any,
  requireRole('Manager') as any,
  [
    body('notes').optional().trim(),
    validateRequest
  ],
  approve as any
);

router.post(
  '/reject',
  authenticate as any,
  requireRole('Manager') as any,
  [
    body('notes').trim().notEmpty().withMessage('Rejection notes are required'),
    validateRequest
  ],
  reject as any
);

router.post(
  '/publish',
  authenticate as any,
  requireRole('Administrator') as any,
  publish as any
);

router.post(
  '/rollback',
  authenticate as any,
  requireRole('Administrator') as any,
  [
    body('version').isInt().withMessage('Target version must be an integer value'),
    validateRequest
  ],
  rollback as any
);

export default router;
