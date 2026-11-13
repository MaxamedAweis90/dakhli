import { Router } from 'express';
import {
  createUploadSession,
  getUploadSession,
  uploadDirect,
  uploadToSession,
  uploadAvatar,
  uploadItem,
  streamMedia,
  initializeStorageFolders,
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import {
  uploadItemImage,
  uploadAvatarImage,
} from '../middleware/uploadValidation';

const router = Router();

// Public media streaming proxy for Vercel Blob storage (with immutable caching)
router.get('/media/{*path}', streamMedia);

// Initialize / verify folders in Vercel Blob store ('dakhli-item-assets')
router.post('/init', initializeStorageFolders);

// Dedicated endpoint for user profile avatars (Max 2MB, destination 'avatars/')
router.post('/avatar', authenticate, uploadAvatarImage, uploadAvatar);

// Dedicated endpoint for items photos (Max 5MB, destination 'items/')
router.post('/item', authenticate, uploadItemImage, uploadItem);

// Direct upload fallback endpoint with optional ?folder=items|avatars query parameter
router.post('/direct', authenticate, uploadItemImage, uploadDirect);

// Cross-device QR code upload session management
router.post('/session', authenticate, createUploadSession);
router.get('/session/:sessionId', getUploadSession);
router.post('/session/:sessionId', uploadItemImage, uploadToSession);

export default router;
