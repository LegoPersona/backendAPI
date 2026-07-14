import { Router } from 'express';
import { authMiddleware, profileImageUploadHandler } from '../../middlewares';
import {
	getCurrentUserProfileController,
	updateCurrentUserProfileController,
} from '../../controllers/users.controller';

const usersRoutes = Router();

usersRoutes.use(authMiddleware);
usersRoutes.get('/me/profile', getCurrentUserProfileController);
usersRoutes.patch('/me/profile', profileImageUploadHandler, updateCurrentUserProfileController);

export default usersRoutes;
