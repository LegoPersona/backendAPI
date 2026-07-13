import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getCurrentUserProfile } from '../services/profile.service';

const getApiBaseUrl = (req: AuthenticatedRequest): string => {
  const host = req.get('host');
  if (!host) {
    return '';
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' && forwardedProto.length > 0
    ? forwardedProto.split(',')[0].trim()
    : req.protocol;

  return `${protocol}://${host}`;
};

export const getCurrentUserProfileController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  try {
    const profile = await getCurrentUserProfile(userId, getApiBaseUrl(req));
    res.status(200).json(profile);
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    res.status(error.status ?? 500).json({ message: error.message ?? 'Failed to load profile.' });
  }
};
