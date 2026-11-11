import { Router } from 'express';
import {
  checkEmail,
  getMe,
  googleAuth,
  login,
  register,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  checkEmailSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
} from '../schemas/authSchemas';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/check-email', validateRequest({ body: checkEmailSchema }), checkEmail);
router.post('/google', validateRequest({ body: googleAuthSchema }), googleAuth);
router.get('/me', authenticate, getMe);

export default router;
