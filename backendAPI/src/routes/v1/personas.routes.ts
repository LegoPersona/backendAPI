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
  getPersonaOriginalImage,
} from '../../controllers/personas.controller';

const personasRoutes = Router();

personasRoutes.use(authMiddleware);

personasRoutes.get('/', getPersonas);
personasRoutes.get('/ratelimit', getRateLimitStatus);
personasRoutes.get('/tasks/:jobId/status', getPersonaGenerationStatus);
personasRoutes.get('/:id', getPersonaById);
personasRoutes.get('/:id/instructions', getPersonaInstructions);
personasRoutes.get('/:id/image', getPersonaImage);
personasRoutes.get('/:id/legoPartsJson', getPersonaLegoPartsJson);
personasRoutes.get('/:id/original-image', getPersonaOriginalImage);
personasRoutes.post('/', rateLimitMiddleware, imageUpload.single('image'), createPersona);
personasRoutes.delete('/:personaId', deletePersona);

export default personasRoutes;