import { Router } from 'express';
import {
  checkoff,
  getLogs,
  getSavingsPreview,
} from '../controllers/dailyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/checkoff', checkoff);
router.get('/logs', getLogs);
router.get('/savings-preview', getSavingsPreview);

export default router;
