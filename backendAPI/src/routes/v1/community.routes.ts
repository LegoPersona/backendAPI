import { Router } from 'express';
import { authMiddleware } from '../../middlewares';
import {
  addComment,
  getFilterOptions,
  getGallery,
  likeCommunityPersona,
  unlikeCommunityPersona,
} from '../../controllers/community.controller';

const communityRoutes = Router();

communityRoutes.use(authMiddleware);

communityRoutes.get('/', getGallery);
communityRoutes.get('/filters', getFilterOptions);
communityRoutes.post('/:personaId/like', likeCommunityPersona);
communityRoutes.delete('/:personaId/like', unlikeCommunityPersona);
communityRoutes.post('/:personaId/comments', addComment);

export default communityRoutes;
