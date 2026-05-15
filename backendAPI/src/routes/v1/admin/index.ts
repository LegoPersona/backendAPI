import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../../../middlewares';
import modulesRoutes from './modules.routes';
import usersRoutes from './users.routes';

const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.use('/users', usersRoutes);
adminRouter.use('/modules', modulesRoutes);

export default adminRouter;
