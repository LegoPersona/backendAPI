import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, profileImageUpload } from '../../middlewares';
import {
	getCurrentUserProfileController,
	getProfileImageController,
	updateCurrentUserProfileController,
} from '../../controllers/users.controller';

const usersRoutes = Router();

usersRoutes.get('/profile-images/:profileImageKey', getProfileImageController);

usersRoutes.use(authMiddleware);
usersRoutes.get('/me/profile', getCurrentUserProfileController);
usersRoutes.patch('/me/profile', (req, res, next) => {
	profileImageUpload.single('profileImage')(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === 'LIMIT_FILE_SIZE') {
				res.status(400).json({ message: 'Profile image must be 5 MB or smaller.' });
				return;
			}

			res.status(400).json({ message: 'Profile image must be JPG, PNG, or WebP.' });
			return;
		}

		res.status(400).json({ message: 'Profile image must be JPG, PNG, or WebP.' });
	});
}, updateCurrentUserProfileController);

export default usersRoutes;
