import { Router } from 'express';
import { authMiddleware, imageUpload, rateLimitMiddleware } from '../../middlewares';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  deletePersona,
  getPersonaInstructions,
  getPersonaLegoPartsJson,
  getPersonaGenerationStatus,
  getRateLimitStatus,
  cancelPersonaGeneration,
} from '../../controllers/personas.controller';

const personasRoutes = Router();

personasRoutes.use(authMiddleware);

personasRoutes.get('/', getPersonas);
personasRoutes.get('/ratelimit', getRateLimitStatus);
personasRoutes.get('/tasks/:jobId/status', getPersonaGenerationStatus);
personasRoutes.post('/tasks/:jobId/cancel', cancelPersonaGeneration);
personasRoutes.get('/:id', getPersonaById);
personasRoutes.get('/:id/instructions', getPersonaInstructions);
personasRoutes.get('/:id/legoPartsJson', getPersonaLegoPartsJson);
personasRoutes.post('/', rateLimitMiddleware, imageUpload.single('image'), createPersona);
personasRoutes.delete('/:personaId', deletePersona);

export default personasRoutes;