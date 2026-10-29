import { Router } from 'express';
import authRoutes from './authRoutes';
import balanceRoutes from './balanceRoutes';
import overheadRoutes from './overheadRoutes';
import dailyRoutes from './dailyRoutes';
import savePlanRoutes from './savePlanRoutes';
import itemRoutes from './itemRoutes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/baseline', balanceRoutes);
apiRouter.use('/balance', balanceRoutes);
apiRouter.use('/overhead', overheadRoutes);
apiRouter.use('/overheads', overheadRoutes);
apiRouter.use('/daily', dailyRoutes);
apiRouter.use('/save-plans', savePlanRoutes);
apiRouter.use('/items', itemRoutes);

export default apiRouter;
