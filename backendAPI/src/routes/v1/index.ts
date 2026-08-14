import { Router } from 'express';
import authRoutes from './auth.routes';
import personasRoutes from './personas.routes';
import usersRoutes from './users.routes';
import communityRoutes from './community.routes';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/personas', personasRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/community', communityRoutes);

export default v1Router;
