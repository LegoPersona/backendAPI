import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../services/profile.service';

const ALLOWED_PROFILE_UPDATE_FIELDS = new Set(['username']);

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
    const profile = await getCurrentUserProfile(userId);
    res.status(200).json(profile);
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    res.status(error.status ?? 500).json({ message: error.message ?? 'Failed to load profile.' });
  }
};

export const updateCurrentUserProfileController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const invalidFields = Object.keys(req.body ?? {}).filter((field) => !ALLOWED_PROFILE_UPDATE_FIELDS.has(field));

  if (invalidFields.length > 0) {
    res.status(400).json({ message: 'Only username and profileImage can be updated.' });
    return;
  }

  if (typeof req.body?.username !== 'string') {
    res.status(400).json({ message: 'Username is required.' });
    return;
  }

  try {
    const result = await updateCurrentUserProfile(
      userId,
      {
        username: req.body.username,
        ...(req.file ? {
          profileImage: {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
          },
        } : {}),
      },
    );

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    res.status(error.status ?? 500).json({ message: error.message ?? 'Failed to update profile.' });
  }
};
