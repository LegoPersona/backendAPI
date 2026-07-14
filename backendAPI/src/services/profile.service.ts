import { randomUUID } from 'crypto';
import path from 'path';
import { Types } from 'mongoose';
import { Persona, User } from '../models';
import { CurrentUserProfileResponse, PublicUserProfile, UpdateCurrentUserProfileInput } from '../types';
import { PERSONA_IMAGE_SUBDIR, PROFILE_IMAGE_SUBDIR, deleteProfileImage, resolveImageExtension, saveProfileImage } from '../utils';
import { calculateAchievements } from './achievement.service';

interface UserProfileRecord {
  _id: Types.ObjectId;
  username: string;
  email?: string;
  profileImageUrl?: string | null;
}

interface PersonaProfileRecord {
  _id: Types.ObjectId;
  createdAt: Date;
  partsJson?: Record<string, unknown>[];
  /** Filenames of images stored under public/personas. */
  personaImage?: string;
  originalImage?: string;
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

const validateUsername = (rawUsername: string): string => {
  const username = rawUsername.trim();

  if (!username) {
    throw Object.assign(new Error('Username is required.'), { status: 400 });
  }

  if (username.length < 2 || username.length > 40) {
    throw Object.assign(new Error('Username must be between 2 and 40 characters.'), { status: 400 });
  }

  return username;
};

const isLocalProfileImageUrl = (url: string | null | undefined): url is string =>
  typeof url === 'string' && url.startsWith(`/${PROFILE_IMAGE_SUBDIR}/`);

/** Deletes the file behind a stored profile image URL, but only for local /profiles/ paths. */
const deleteLocalProfileImage = async (url: string | null | undefined): Promise<void> => {
  if (!isLocalProfileImageUrl(url)) return;
  await deleteProfileImage(path.basename(url));
};

const mapPublicUserProfile = (user: UserProfileRecord): PublicUserProfile => ({
  id: user._id.toString(),
  username: user.username,
  ...(user.email ? { email: user.email } : {}),
  profileImageUrl: user.profileImageUrl ?? null,
});

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
    .select('username email profileImageUrl')
    .lean<UserProfileRecord | null>();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const personas = await Persona.find({ userId: userObjectId })
    .select('_id createdAt partsJson personaImage originalImage featured likes comments likesCount commentsCount')
    .sort({ createdAt: -1 })
    .lean<PersonaProfileRecord[]>();

  const personasCount = personas.length;

  const personaSummaries = personas.map((persona) => {
    const id = persona._id.toString();

    return {
      id,
      createdAt: persona.createdAt,
      partsCount: getPartsCount(persona.partsJson),
      // Image files are served statically from the public folder at the API origin.
      originalImageUrl: persona.originalImage
        ? buildApiResourceUrl(apiBaseUrl, `/${PERSONA_IMAGE_SUBDIR}/${persona.originalImage}`)
        : null,
      legoImageUrl: persona.personaImage
        ? buildApiResourceUrl(apiBaseUrl, `/${PERSONA_IMAGE_SUBDIR}/${persona.personaImage}`)
        : null,
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
    user: mapPublicUserProfile(user),
    stats: {
      personasCount,
      unlockedAchievementsCount: achievements.filter((achievement) => achievement.isUnlocked).length,
      totalAchievementsCount: achievements.length,
    },
    personas: personaSummaries,
    achievements,
  };
};

export const updateCurrentUserProfile = async (
  userId: string,
  update: UpdateCurrentUserProfileInput,
): Promise<{ user: PublicUserProfile }> => {
  const userObjectId = new Types.ObjectId(userId);
  const nextUsername = validateUsername(update.username);

  const user = await User.findById(userObjectId)
    .select('username email profileImageUrl')
    .lean<UserProfileRecord | null>();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  if (nextUsername !== user.username) {
    const existingUser = await User.findOne({
      username: nextUsername,
      _id: { $ne: userObjectId },
    })
      .select('_id')
      .lean<{ _id: Types.ObjectId } | null>();

    if (existingUser) {
      throw Object.assign(new Error('Username already taken.'), { status: 409 });
    }
  }

  let nextProfileImageUrl = user.profileImageUrl ?? null;

  if (update.profileImage) {
    const extension = resolveImageExtension(update.profileImage.mimetype);
    const filename = `${userId}-${randomUUID()}.${extension}`;
    await saveProfileImage(filename, update.profileImage.buffer);
    nextProfileImageUrl = `/${PROFILE_IMAGE_SUBDIR}/${filename}`;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userObjectId,
      {
        username: nextUsername,
        profileImageUrl: nextProfileImageUrl,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .select('username email profileImageUrl')
      .lean<UserProfileRecord | null>();

    if (!updatedUser) {
      throw Object.assign(new Error('User not found.'), { status: 404 });
    }

    if (update.profileImage && user.profileImageUrl !== nextProfileImageUrl) {
      // Best effort: the DB already points at the new image.
      await deleteLocalProfileImage(user.profileImageUrl).catch((cleanupError) => {
        console.warn(`[ProfileService] Failed to delete old profile image for user ${userId}:`, cleanupError);
      });
    }

    return {
      user: mapPublicUserProfile(updatedUser),
    };
  } catch (error) {
    if (update.profileImage) {
      // Roll back the newly written file so it isn't orphaned.
      await deleteLocalProfileImage(nextProfileImageUrl).catch(() => {});
    }

    throw error;
  }
};

export const profileServiceUtils = {
  getPartsCount,
};
