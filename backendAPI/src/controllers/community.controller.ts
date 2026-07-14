import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import {
  CommunitySort,
  addCommunityComment,
  getCommunityFilterOptions,
  getCommunityGallery,
  likePersona,
  unlikePersona,
} from '../services/community.service';
import { AuthenticatedRequest } from '../types';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

const parseSort = (value: unknown): CommunitySort =>
  value === 'popularity' || value === 'most-discussed' ? value : 'newest';

const parseNonNegativeInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return parsed;
};

const parseColorIdList = (value: unknown): number[] | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const ids = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id >= 0);
  return ids.length ? ids : undefined;
};

const parseOptionalBool = (value: unknown): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const getErrorStatus = (error: unknown): number => {
  const status = (error as { status?: number })?.status;
  return typeof status === 'number' ? status : 500;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const getGallery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await getCommunityGallery(req.user!.userId, {
      sort: parseSort(req.query.sort),
      skip: parseNonNegativeInt(req.query.skip, 0),
      limit: Math.min(Math.max(parseNonNegativeInt(req.query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT),
      hairColors: parseColorIdList(req.query.hairColors),
      skinTones: parseColorIdList(req.query.skinTones),
      hasGlasses: parseOptionalBool(req.query.hasGlasses),
      hasBeard: parseOptionalBool(req.query.hasBeard),
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: getErrorMessage(error, 'Failed to get community gallery.') });
  }
};

export const getFilterOptions = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const options = await getCommunityFilterOptions();
    res.status(200).json(options);
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: getErrorMessage(error, 'Failed to get filter options.') });
  }
};

export const likeCommunityPersona = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { personaId } = req.params;
  if (!isValidObjectId(personaId)) {
    res.status(400).json({ message: 'Invalid persona id.' });
    return;
  }
  try {
    res.status(200).json(await likePersona(personaId, req.user!.userId));
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: getErrorMessage(error, 'Failed to like persona.') });
  }
};

export const unlikeCommunityPersona = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { personaId } = req.params;
  if (!isValidObjectId(personaId)) {
    res.status(400).json({ message: 'Invalid persona id.' });
    return;
  }
  try {
    res.status(200).json(await unlikePersona(personaId, req.user!.userId));
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: getErrorMessage(error, 'Failed to unlike persona.') });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { personaId } = req.params;
  if (!isValidObjectId(personaId)) {
    res.status(400).json({ message: 'Invalid persona id.' });
    return;
  }
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  try {
    const comment = await addCommunityComment(personaId, req.user!.userId, text);
    res.status(201).json(comment);
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: getErrorMessage(error, 'Failed to add comment.') });
  }
};
