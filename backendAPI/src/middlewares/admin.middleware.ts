import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';

export const adminMiddleware = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	if (!req.user?.roles.includes('admin')) {
		res.status(403).json({ message: 'Forbidden.' });
		return;
	}
	next();
};
