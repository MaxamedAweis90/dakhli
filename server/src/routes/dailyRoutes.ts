import { Router } from 'express';
import {
  checkoff,
  getLogs,
  getSavingsPreview,
} from '../controllers/dailyController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { dailyCheckoffSchema } from '../schemas/dailySchemas';

const router = Router();

router.use(authenticate);

router.post('/checkoff', validateRequest({ body: dailyCheckoffSchema }), checkoff);
router.get('/logs', getLogs);
router.get('/savings-preview', getSavingsPreview);

export default router;
