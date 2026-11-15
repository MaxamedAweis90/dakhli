import { Router } from 'express';
import {
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
  exportFinancialArchive,
  requestPasswordOtp,
  updatePassword,
  deactivateAccount,
  restoreAccount,
} from '../controllers/authController';
import { authenticate, authenticateRestoration } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  requestPasswordOtpSchema,
  updatePasswordSchema,
  restoreAccountSchema,
} from '../schemas/authSchemas';

const router = Router();

// Restoration endpoint (authenticates strictly via ACCOUNT_RESTORATION token)
router.post('/restore', validateRequest({ body: restoreAccountSchema }), authenticateRestoration, restoreAccount);

router.use(authenticate);

router.get('/profile', getMe);
router.patch('/profile', validateRequest({ body: updateProfileSchema }), updateProfile);
router.get('/preferences', getPreferences);
router.patch('/preferences', validateRequest({ body: updatePreferencesSchema }), updatePreferences);
router.put('/preferences', validateRequest({ body: updatePreferencesSchema }), updatePreferences);
router.get('/export', exportFinancialArchive);
router.post('/request-password-otp', validateRequest({ body: requestPasswordOtpSchema }), requestPasswordOtp);
router.patch('/update-password', validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/deactivate', deactivateAccount);

export default router;

