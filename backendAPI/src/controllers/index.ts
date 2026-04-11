import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { User } from '../models';
import { JwtUserPayload } from '../types';

const SALT_ROUNDS = 10;

const buildToken = (payload: JwtUserPayload): string => {
	if (!config.JWT_SECRET) {
		throw new Error('JWT_SECRET is not configured.');
	}

	return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body as { username?: string; password?: string };

	if (!username || !password) {
		res.status(400).json({ message: 'username and password are required.' });
		return;
	}

	const existingUser = await User.findOne({ username }).lean();
	if (existingUser) {
		res.status(409).json({ message: 'Username is already taken.' });
		return;
	}

	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
	const createdUser = await User.create({ username, password: hashedPassword });

	res.status(201).json({
		id: createdUser._id,
		username: createdUser.username,
		createdAt: createdUser.createdAt,
	});
};

export const login = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body as { username?: string; password?: string };

	if (!username || !password) {
		res.status(400).json({ message: 'username and password are required.' });
		return;
	}

	const user = await User.findOne({ username });
	if (!user) {
		res.status(401).json({ message: 'Invalid credentials.' });
		return;
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		res.status(401).json({ message: 'Invalid credentials.' });
		return;
	}

	const token = buildToken({ userId: String(user._id), username: user.username });
	res.status(200).json({ token });
};