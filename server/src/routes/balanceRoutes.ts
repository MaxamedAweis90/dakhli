import { Router } from 'express';
import { getOverview, updateBaseline } from '../controllers/balanceController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateBaselineSchema } from '../schemas/baselineSchemas';

const router = Router();

router.use(authenticate);

router.get('/', getOverview);
router.get('/overview', getOverview);
router.put('/', validateRequest({ body: updateBaselineSchema }), updateBaseline);
router.put('/baseline', validateRequest({ body: updateBaselineSchema }), updateBaseline);
router.patch('/baseline', validateRequest({ body: updateBaselineSchema }), updateBaseline);

export default router;
