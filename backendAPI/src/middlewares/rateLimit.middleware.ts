import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { RateLimit } from '../models';
import config from '../config/env';

export const rateLimitMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  if (user.roles.includes('admin')) {
    next();
    return;
  }

  const userId = new Types.ObjectId(user.userId);
  const now = new Date();
  const limit = config.DAILY_PERSONA_LIMIT;

  const record = await RateLimit.findOneAndUpdate(
    { userId },
    { $inc: { count: 1 }, $setOnInsert: { windowStart: now } },
    { upsert: true, new: true }
  );

  if (record.count > limit) {
    const retryAfter = new Date(record.windowStart.getTime() + 86400 * 1000);
    res.status(429).json({
      message: 'Daily persona creation limit reached.',
      limit,
      retryAfter: retryAfter.toISOString(),
    });
    return;
  }

  next();
};
