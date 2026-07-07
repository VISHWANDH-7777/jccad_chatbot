import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadDocument,
  submitReview,
  approveDocument,
  publishDocument,
  searchDocuments,
  downloadDocument
} from '../controllers/document';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

import fs from 'fs';

const uploadDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure local disk storage for temporary files upload buffering
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

// Router Mappings with RBAC Guards
router.post(
  '/upload',
  authenticate as any,
  requireRole('Employee') as any,
  upload.single('file'),
  uploadDocument as any
);

router.post(
  '/:id/submit-review',
  authenticate as any,
  requireRole('Employee') as any,
  submitReview as any
);

router.post(
  '/:id/approve',
  authenticate as any,
  requireRole('Manager') as any,
  approveDocument as any
);

router.post(
  '/:id/publish',
  authenticate as any,
  requireRole('Administrator') as any,
  publishDocument as any
);

router.get('/search', authenticate as any, searchDocuments as any);

router.get('/:id/download', authenticate as any, downloadDocument as any);

export default router;
