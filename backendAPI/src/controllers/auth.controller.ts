import { Request, Response } from 'express';
import {
	registerUser,
	loginUser,
	rotateRefreshToken,
	logoutUser,
	getAuthenticatedUser,
} from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body;
	if (!username || !password) {
		res.status(400).json({ message: 'Username and password are required.' });
		return;
	}
	try {
		const tokens = await registerUser(username, password);
		res.status(201).json(tokens);
	} catch (err: any) {
		res.status(err.status ?? 500).json({ message: err.message });
	}
};

export const login = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body;
	if (!username || !password) {
		res.status(400).json({ message: 'Username and password are required.' });
		return;
	}
	try {
		const tokens = await loginUser(username, password);
		res.status(200).json(tokens);
	} catch (err: any) {
		res.status(err.status ?? 500).json({ message: err.message });
	}
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	const userId = req.user?.userId;
	if (!userId) {
		res.status(401).json({ message: 'Unauthorized.' });
		return;
	}
	try {
		const user = await getAuthenticatedUser(userId);
		res.status(200).json(user);
	} catch (err: any) {
		res.status(err.status ?? 500).json({ message: err.message });
	}
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
	const { refreshToken } = req.body;
	if (!refreshToken) {
		res.status(400).json({ message: 'refreshToken is required.' });
		return;
	}
	try {
		const tokens = await rotateRefreshToken(refreshToken);
		res.status(200).json(tokens);
	} catch (err: any) {
		res.status(err.status ?? 500).json({ message: err.message });
	}
};

export const logout = async (req: Request, res: Response): Promise<void> => {
	const { refreshToken } = req.body;
	if (!refreshToken) {
		res.status(400).json({ message: 'refreshToken is required.' });
		return;
	}
	try {
		await logoutUser(refreshToken);
		res.status(200).json({ message: 'Logged out.' });
	} catch (err: any) {
		res.status(err.status ?? 500).json({ message: err.message });
	}
};
