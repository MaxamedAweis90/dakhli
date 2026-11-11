import { Router } from 'express';
import {
  getMe,
  updateProfile,
  updatePassword,
  deactivateAccount,
  restoreAccount,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateProfileSchema,
  updatePasswordSchema,
} from '../schemas/authSchemas';

const router = Router();

// Public restoration endpoint (authenticates via restorationToken in body or Bearer)
router.post('/restore', restoreAccount);

router.use(authenticate);

router.get('/profile', getMe);
router.patch('/profile', validateRequest({ body: updateProfileSchema }), updateProfile);
router.patch('/update-password', validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/deactivate', deactivateAccount);

export default router;

