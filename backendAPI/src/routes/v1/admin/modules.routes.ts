import { Router } from 'express';
import {
  listModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
} from '../../../controllers/v1/admin/modules.controller';

const adminModulesRoutes = Router();

adminModulesRoutes.get('/', listModules);
adminModulesRoutes.get('/:id', getModuleById);
adminModulesRoutes.post('/', createModule);
adminModulesRoutes.patch('/:id', updateModule);
adminModulesRoutes.delete('/:id', deleteModule);

export default adminModulesRoutes;