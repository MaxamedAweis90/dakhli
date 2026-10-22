import { Router } from 'express';
import { getOverview, updateBaseline } from '../controllers/balanceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/overview', getOverview);
router.patch('/baseline', updateBaseline);

export default router;
