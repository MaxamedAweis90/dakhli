import { Router } from 'express';
import {
  checkEmail,
  getMe,
  googleAuth,
  login,
  register,
  verifyOtp,
  resendOtp,
  updateProfile,
  requestPasswordOtp,
  updatePassword,
  deactivateAccount,
  restoreAccount,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  checkEmailSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  updateProfileSchema,
  requestPasswordOtpSchema,
  updatePasswordSchema,
  restoreAccountSchema,
} from '../schemas/authSchemas';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/check-email', validateRequest({ body: checkEmailSchema }), checkEmail);
router.post('/google', validateRequest({ body: googleAuthSchema }), googleAuth);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), verifyOtp);
router.post('/resend-otp', validateRequest({ body: resendOtpSchema }), resendOtp);
router.post('/restore', restoreAccount);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validateRequest({ body: updateProfileSchema }), updateProfile);
router.post('/request-password-otp', authenticate, validateRequest({ body: requestPasswordOtpSchema }), requestPasswordOtp);
router.patch('/update-password', authenticate, validateRequest({ body: updatePasswordSchema }), updatePassword);
router.post('/deactivate', authenticate, deactivateAccount);

export default router;
