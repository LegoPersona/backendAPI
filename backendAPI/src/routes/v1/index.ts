import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import personasRoutes from './personas.routes';
import adminModulesRoutes from './admin/modules.routes';
import testRoutes from '../test.routes';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/personas', personasRoutes);
v1Router.use('/admin/modules', adminModulesRoutes);
v1Router.use('/test', testRoutes);

export default v1Router;