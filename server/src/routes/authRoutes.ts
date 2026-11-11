import { Router } from 'express';
import {
  checkEmail,
  getMe,
  googleAuth,
  login,
  register,
  verifyOtp,
  resendOtp,
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
} from '../schemas/authSchemas';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/check-email', validateRequest({ body: checkEmailSchema }), checkEmail);
router.post('/google', validateRequest({ body: googleAuthSchema }), googleAuth);
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), verifyOtp);
router.post('/resend-otp', validateRequest({ body: resendOtpSchema }), resendOtp);
router.get('/me', authenticate, getMe);

export default router;
