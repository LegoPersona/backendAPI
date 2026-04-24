import { Router } from 'express';
import {
  login,
  register,
  getCurrentUser,
} from '../../controllers/v1/auth.controller';

const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', getCurrentUser);

export default authRoutes;