import { Router } from 'express';
import { authMiddleware, imageUpload, rateLimitMiddleware } from '../../middlewares';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  deletePersona,
  getPersonaInstructions,
  getPersonaImage,
  getPersonaGenerationStatus,
  getRateLimitStatus,
} from '../../controllers/personas.controller';

const personasRoutes = Router();

personasRoutes.use(authMiddleware);

personasRoutes.get('/', getPersonas);
personasRoutes.get('/ratelimit', getRateLimitStatus);
personasRoutes.get('/tasks/:jobId/status', getPersonaGenerationStatus);
personasRoutes.get('/:personaId', getPersonaById);
personasRoutes.get('/:personaId/instructions', getPersonaInstructions);
personasRoutes.get('/:personaId/image', getPersonaImage);
personasRoutes.post('/', rateLimitMiddleware, imageUpload.single('image'), createPersona);
personasRoutes.delete('/:personaId', deletePersona);

export default personasRoutes;