import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { AuthenticatedRequest, JwtUserPayload } from '../types';

export const authMiddleware = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).json({ message: 'Missing or invalid authorization header.' });
		return;
	}

	if (!config.JWT_SECRET) {
		res.status(500).json({ message: 'JWT_SECRET is not configured.' });
		return;
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, config.JWT_SECRET) as JwtUserPayload;
		req.user = decoded;
		next();
	} catch {
		res.status(401).json({ message: 'Invalid or expired token.' });
	}
};