import { Router } from 'express';
import {
  cancelPlan,
  completePlan,
  createPlan,
  deletePlan,
  fundPlan,
  listSavePlans,
  patchPlan,
} from '../controllers/savePlanController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listSavePlans);
router.post('/', createPlan);
router.patch('/:id/fund', fundPlan);
router.patch('/:id/deposit', fundPlan);
router.post('/:id/deposit', fundPlan);
router.patch('/:id/cancel', cancelPlan);
router.post('/:id/cancel', cancelPlan);
router.patch('/:id/complete', completePlan);
router.post('/:id/complete', completePlan);
router.patch('/:id', patchPlan);
router.delete('/:id', deletePlan);

export default router;
