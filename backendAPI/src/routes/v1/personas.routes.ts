import { Router } from 'express';
import { authMiddleware, imageUpload, rateLimitMiddleware } from '../../middlewares';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  deletePersona,
  getPersonaInstructions,
  getPersonaImage,
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
personasRoutes.get('/:id/image', getPersonaImage);
personasRoutes.get('/:id/legoPartsJson', getPersonaLegoPartsJson);
personasRoutes.post('/', rateLimitMiddleware, imageUpload.single('image'), createPersona);
personasRoutes.delete('/:id', deletePersona);

export default personasRoutes;