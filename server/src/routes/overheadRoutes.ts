import { Router } from 'express';
import {
  createOverhead,
  deleteOverhead,
  listOverheads,
  payOverhead,
  updateMonthlyBilled,
  updateOverhead,
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
router.patch('/:id', updateOverhead);
router.put('/:id', updateOverhead);
router.delete('/:id', deleteOverhead);

export default router;
