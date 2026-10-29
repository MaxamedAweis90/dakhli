import { Router } from 'express';
import {
  createOverhead,
  deleteOverhead,
  listOverheads,
  payOverhead,
  updateMonthlyBilled,
  updateOverheadStatus,
} from '../controllers/overheadController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listOverheads);
router.post('/', createOverhead);
router.patch('/:id/monthly', updateMonthlyBilled);
router.patch('/:id/pay', payOverhead);
router.patch('/:id/status', updateOverheadStatus);
router.delete('/:id', deleteOverhead);

export default router;
