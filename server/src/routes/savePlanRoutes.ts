import { Router } from 'express';
import {
  cancelPlan,
  completePlan,
  createPlan,
  fundPlan,
  listSavePlans,
} from '../controllers/savePlanController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listSavePlans);
router.post('/', createPlan);
router.patch('/:id/fund', fundPlan);
router.patch('/:id/cancel', cancelPlan);
router.patch('/:id/complete', completePlan);

export default router;
