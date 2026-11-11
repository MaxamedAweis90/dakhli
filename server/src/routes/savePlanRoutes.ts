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
import { validateRequest } from '../middleware/validate';
import { createSavePlanSchema, fundSavePlanSchema, updateSavePlanSchema } from '../schemas/savePlanSchemas';

const router = Router();

router.use(authenticate);

router.get('/', listSavePlans);
router.post('/', validateRequest({ body: createSavePlanSchema }), createPlan);
router.patch('/:id/fund', validateRequest({ body: fundSavePlanSchema }), fundPlan);
router.patch('/:id/deposit', validateRequest({ body: fundSavePlanSchema }), fundPlan);
router.post('/:id/deposit', validateRequest({ body: fundSavePlanSchema }), fundPlan);
router.patch('/:id/cancel', cancelPlan);
router.post('/:id/cancel', cancelPlan);
router.patch('/:id/complete', completePlan);
router.post('/:id/complete', completePlan);
router.patch('/:id', validateRequest({ body: updateSavePlanSchema }), patchPlan);
router.delete('/:id', deletePlan);

export default router;
