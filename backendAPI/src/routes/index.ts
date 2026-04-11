import { Response, Router } from 'express';
import { login, register } from '../controllers';
import { authMiddleware } from '../middlewares';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({ user: req.user });
});

export default router;