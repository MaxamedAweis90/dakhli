import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/authSchemas';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
