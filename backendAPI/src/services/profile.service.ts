import { Types } from 'mongoose';
import { Persona, User } from '../models';
import { CurrentUserProfileResponse } from '../types';
import { calculateAchievements } from './achievement.service';

interface UserProfileRecord {
  _id: Types.ObjectId;
  username: string;
  email?: string;
}

interface PersonaProfileRecord {
  _id: Types.ObjectId;
  createdAt: Date;
  partsJson?: Record<string, unknown>[];
  featured?: boolean;
  likes?: unknown[];
  comments?: unknown[];
  likesCount?: number;
  commentsCount?: number;
}

const QUANTITY_KEYS = ['quantity', 'qty', 'count'];

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const getPartQuantity = (part: Record<string, unknown>): number => {
  for (const [key, rawValue] of Object.entries(part)) {
    if (!QUANTITY_KEYS.includes(key.toLowerCase())) {
      continue;
    }

    const parsed = toNumber(rawValue);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  return 1;
};

const getPartsCount = (partsJson: Record<string, unknown>[] | undefined): number => {
  if (!Array.isArray(partsJson) || partsJson.length === 0) {
    return 0;
  }

  return partsJson.reduce((total, part) => {
    if (!part || typeof part !== 'object' || Array.isArray(part)) {
      return total + 1;
    }

    return total + getPartQuantity(part);
  }, 0);
};

const buildApiResourceUrl = (apiBaseUrl: string, path: string): string => {
  if (!apiBaseUrl) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
};

const getMaxCount = (personas: PersonaProfileRecord[], field: 'likes' | 'comments', countField: 'likesCount' | 'commentsCount'): number => {
  let max = 0;

  for (const persona of personas) {
    const directCount = toNumber(persona[countField]);
    if (directCount !== null) {
      max = Math.max(max, directCount);
      continue;
    }

    const values = persona[field];
    if (Array.isArray(values)) {
      max = Math.max(max, values.length);
    }
  }

  return max;
};

export const getCurrentUserProfile = async (
  userId: string,
  apiBaseUrl: string,
): Promise<CurrentUserProfileResponse> => {
  const userObjectId = new Types.ObjectId(userId);

  const user = await User.findById(userObjectId)
    .select('username email')
    .lean<UserProfileRecord | null>();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const personas = await Persona.find({ userId: userObjectId })
    .select('_id createdAt partsJson featured likes comments likesCount commentsCount')
    .sort({ createdAt: -1 })
    .lean<PersonaProfileRecord[]>();

  const personasCount = personas.length;

  const personaSummaries = personas.map((persona) => {
    const id = persona._id.toString();

    return {
      id,
      createdAt: persona.createdAt,
      partsCount: getPartsCount(persona.partsJson),
      originalImageUrl: null,
      legoImageUrl: buildApiResourceUrl(apiBaseUrl, `/api/v1/personas/${id}/image`),
    };
  });

  const personasAsc = [...personas].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const maxLikes = getMaxCount(personas, 'likes', 'likesCount');
  const maxComments = getMaxCount(personas, 'comments', 'commentsCount');
  const hasFeaturedPersona = personas.some((persona) => persona.featured === true);

  const achievements = calculateAchievements({
    personasCount,
    personasAsc: personasAsc.map((persona) => ({
      createdAt: persona.createdAt,
      featured: persona.featured,
      likesCount: toNumber(persona.likesCount) ?? undefined,
      commentsCount: toNumber(persona.commentsCount) ?? undefined,
    })),
    maxLikes,
    maxComments,
    distinctCommentedPostsCount: 0,
    hasFeaturedPersona,
  });

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      ...(user.email ? { email: user.email } : {}),
    },
    stats: {
      personasCount,
      unlockedAchievementsCount: achievements.filter((achievement) => achievement.isUnlocked).length,
      totalAchievementsCount: achievements.length,
    },
    personas: personaSummaries,
    achievements,
  };
};

export const profileServiceUtils = {
  getPartsCount,
};
