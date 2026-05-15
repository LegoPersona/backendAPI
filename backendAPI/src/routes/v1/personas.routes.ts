import { Router } from 'express';
import { authMiddleware, imageUpload } from '../../middlewares';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  deletePersona,
  getPersonaInstructions,
  getPersonaImage,
} from '../../controllers/personas.controller';

const personasRoutes = Router();

personasRoutes.use(authMiddleware);

personasRoutes.get('/', getPersonas);
personasRoutes.get('/:id', getPersonaById);
personasRoutes.get('/:id/instructions', getPersonaInstructions);
personasRoutes.get('/:id/image', getPersonaImage);
personasRoutes.post('/', imageUpload.single('image'), createPersona);
personasRoutes.delete('/:id', deletePersona);

export default personasRoutes;