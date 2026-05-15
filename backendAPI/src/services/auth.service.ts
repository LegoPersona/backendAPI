import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { User } from '../models';
import { JwtUserPayload } from '../types';

const SALT_ROUNDS = 10;

function generateAccessToken(payload: JwtUserPayload): string {
	return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
}

function generateRefreshToken(userId: string): string {
	return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export async function registerUser(
	username: string,
	password: string
): Promise<{ accessToken: string; refreshToken: string }> {
	const existing = await User.findOne({ username });
	if (existing) {
		throw Object.assign(new Error('Username already taken.'), { status: 400 });
	}
	const hashed = await bcrypt.hash(password, SALT_ROUNDS);
	const user = await User.create({ username, password: hashed });
	const accessToken = generateAccessToken({ userId: user._id.toString(), username, roles: [] });
	const refreshToken = generateRefreshToken(user._id.toString());
	user.refreshTokens.push(refreshToken);
	await user.save();
	return { accessToken, refreshToken };
}

export async function loginUser(
	username: string,
	password: string
): Promise<{ accessToken: string; refreshToken: string }> {
	const user = await User.findOne({ username });
	if (!user) {
		throw Object.assign(new Error('Invalid credentials.'), { status: 401 });
	}
	const match = await bcrypt.compare(password, user.password);
	if (!match) {
		throw Object.assign(new Error('Invalid credentials.'), { status: 401 });
	}
	const accessToken = generateAccessToken({ userId: user._id.toString(), username: user.username, roles: user.roles });
	const refreshToken = generateRefreshToken(user._id.toString());
	user.refreshTokens.push(refreshToken);
	await user.save();
	return { accessToken, refreshToken };
}

export async function rotateRefreshToken(
	oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
	let decoded: { userId: string };
	try {
		decoded = jwt.verify(oldRefreshToken, config.JWT_REFRESH_SECRET) as { userId: string };
	} catch {
		throw Object.assign(new Error('Invalid or expired refresh token.'), { status: 401 });
	}
	const user = await User.findOne({ _id: decoded.userId, refreshTokens: oldRefreshToken });
	if (!user) {
		throw Object.assign(new Error('Refresh token not recognised.'), { status: 401 });
	}
	user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
	const accessToken = generateAccessToken({ userId: user._id.toString(), username: user.username, roles: user.roles });
	const refreshToken = generateRefreshToken(user._id.toString());
	user.refreshTokens.push(refreshToken);
	await user.save();
	return { accessToken, refreshToken };
}

export async function logoutUser(refreshToken: string): Promise<void> {
	await User.updateOne(
		{ refreshTokens: refreshToken },
		{ $pull: { refreshTokens: refreshToken } }
	);
}

export async function getAuthenticatedUser(
	userId: string
): Promise<{ userId: string; username: string }> {
	const user = await User.findById(userId).select('username');
	if (!user) {
		throw Object.assign(new Error('User not found.'), { status: 404 });
	}
	return { userId: user._id.toString(), username: user.username };
}
