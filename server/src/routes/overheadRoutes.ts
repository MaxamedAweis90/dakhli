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
import { validateRequest } from '../middleware/validate';
import { createOverheadSchema, updateOverheadSchema } from '../schemas/overheadSchemas';

const router = Router();

router.use(authenticate);

router.get('/', listOverheads);
router.post('/', validateRequest({ body: createOverheadSchema }), createOverhead);
router.patch('/:id/monthly', updateMonthlyBilled);
router.patch('/:id/pay', payOverhead);
router.patch('/:id/status', updateOverheadStatus);
router.patch('/:id', validateRequest({ body: updateOverheadSchema }), updateOverhead);
router.put('/:id', validateRequest({ body: updateOverheadSchema }), updateOverhead);
router.delete('/:id', deleteOverhead);

export default router;
