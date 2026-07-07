import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import path from 'path';
import {
  createConversation,
  listConversations,
  renameConversation,
  deleteConversation,
  exportConversation,
  submitFeedback,
  uploadImage
} from '../controllers/conversation';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for image attachments
  }
});

router.post('/', authenticate as any, createConversation as any);
router.get('/', authenticate as any, listConversations as any);

router.put(
  '/:id/rename',
  authenticate as any,
  [
    param('id').isMongoId().withMessage('Invalid thread ID'),
    body('title').trim().notEmpty().withMessage('Title parameter is required'),
    validateRequest
  ],
  renameConversation as any
);

router.delete(
  '/:id',
  authenticate as any,
  [
    param('id').isMongoId().withMessage('Invalid thread ID'),
    validateRequest
  ],
  deleteConversation as any
);

router.get(
  '/:id/export',
  authenticate as any,
  [
    param('id').isMongoId().withMessage('Invalid thread ID'),
    validateRequest
  ],
  exportConversation as any
);

router.post(
  '/:id/feedback',
  authenticate as any,
  [
    param('id').isMongoId().withMessage('Invalid thread ID'),
    body('messageIndex').isInt().withMessage('Message index must be an integer'),
    body('rating').isIn(['up', 'down']).withMessage('Rating must be up or down'),
    validateRequest
  ],
  submitFeedback as any
);

router.post(
  '/image-upload',
  authenticate as any,
  upload.single('image'),
  uploadImage as any
);

export default router;
