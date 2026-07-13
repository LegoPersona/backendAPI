import { Router } from 'express';
import { authMiddleware } from '../../middlewares';
import { getCurrentUserProfileController } from '../../controllers/users.controller';

const usersRoutes = Router();

usersRoutes.use(authMiddleware);
usersRoutes.get('/me/profile', getCurrentUserProfileController);

export default usersRoutes;
