import { Router } from 'express';
import {
	login,
	register,
	googleLogin,
	getCurrentUser,
	refresh,
	logout,
} from '../../controllers/auth.controller';
import { authMiddleware, profileImageUploadHandler } from '../../middlewares';

const authRoutes = Router();

authRoutes.post('/register', profileImageUploadHandler, register);
authRoutes.post('/login', login);
authRoutes.post('/google', googleLogin);
authRoutes.get('/me', authMiddleware, getCurrentUser);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);

export default authRoutes;
