import { Router } from 'express';
import multer from 'multer';
import {
  createUploadSession,
  getUploadSession,
  uploadDirect,
  uploadToSession,
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// Create session (auth required on desktop)
router.post('/session', authenticate, createUploadSession);

// Check session status (polling from desktop)
router.get('/session/:sessionId', getUploadSession);

// Upload to session (from phone via QR scan)
router.post('/session/:sessionId', upload.single('file'), uploadToSession);

// Direct upload from desktop or mobile file input
router.post('/direct', authenticate, upload.single('file'), uploadDirect);

export default router;

