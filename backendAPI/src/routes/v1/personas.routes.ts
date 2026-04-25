import { Router } from 'express';
import { imageUpload } from '../../middlewares';
import {
  listPersonas,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  getPersonaInstructions,
} from '../../controllers/v1/personas.controller';

const personasRoutes = Router();

personasRoutes.get('/', listPersonas);
personasRoutes.get('/:id', getPersonaById);
personasRoutes.get('/:id/instructions', getPersonaInstructions);
personasRoutes.post('/', imageUpload.single('image'), createPersona);
personasRoutes.patch('/:id', updatePersona);
personasRoutes.delete('/:id', deletePersona);

export default personasRoutes;