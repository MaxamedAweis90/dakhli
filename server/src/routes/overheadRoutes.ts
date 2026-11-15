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
import {
  createOverheadSchema,
  overheadIdParamSchema,
  payOverheadSchema,
  updateMonthlyBilledSchema,
  updateOverheadSchema,
  updateOverheadStatusSchema,
} from '../schemas/overheadSchemas';

const router = Router();

router.use(authenticate);

router.get('/', listOverheads);
router.post('/', validateRequest({ body: createOverheadSchema }), createOverhead);
router.patch(
  '/:id/monthly',
  validateRequest({ params: overheadIdParamSchema, body: updateMonthlyBilledSchema }),
  updateMonthlyBilled
);
router.patch(
  '/:id/pay',
  validateRequest({ params: overheadIdParamSchema, body: payOverheadSchema }),
  payOverhead
);
router.patch(
  '/:id/status',
  validateRequest({ params: overheadIdParamSchema, body: updateOverheadStatusSchema }),
  updateOverheadStatus
);
router.patch(
  '/:id',
  validateRequest({ params: overheadIdParamSchema, body: updateOverheadSchema }),
  updateOverhead
);
router.put(
  '/:id',
  validateRequest({ params: overheadIdParamSchema, body: updateOverheadSchema }),
  updateOverhead
);
router.delete('/:id', validateRequest({ params: overheadIdParamSchema }), deleteOverhead);

export default router;
