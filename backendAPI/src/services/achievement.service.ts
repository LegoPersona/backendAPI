import { ACHIEVEMENT_DEFINITIONS } from './achievement.definitions';
import { AchievementResponse } from '../types';

interface AchievementContextPersona {
  createdAt: Date;
  featured?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export interface AchievementContext {
  personasCount: number;
  personasAsc: AchievementContextPersona[];
  maxLikes: number;
  maxComments: number;
  distinctCommentedPostsCount: number;
  hasFeaturedPersona: boolean;
}

const toIsoOrNull = (value?: Date): string | null => {
  if (!value) {
    return null;
  }

  return value.toISOString();
};

const capped = (progress: number, target: number): number => {
  return Math.min(Math.max(progress, 0), target);
};

export const calculateAchievements = (context: AchievementContext): AchievementResponse[] => {
  const brickStarterUnlocked = context.personasCount >= 1;
  const masterBuilderUnlocked = context.personasCount >= 10;

  const brickStarterUnlockedAt = brickStarterUnlocked ? context.personasAsc[0]?.createdAt : undefined;
  const masterBuilderUnlockedAt = masterBuilderUnlocked ? context.personasAsc[9]?.createdAt : undefined;

  const resultsById: Record<string, AchievementResponse> = {
    'brick-starter': {
      id: 'brick-starter',
      name: 'Brick Starter',
      description: 'Created your first LEGO Persona',
      target: 1,
      progress: capped(context.personasCount, 1),
      isUnlocked: brickStarterUnlocked,
      unlockedAt: toIsoOrNull(brickStarterUnlockedAt),
    },
    'master-builder': {
      id: 'master-builder',
      name: 'Master Builder',
      description: 'Created your 10th LEGO Persona',
      target: 10,
      progress: capped(context.personasCount, 10),
      isUnlocked: masterBuilderUnlocked,
      unlockedAt: toIsoOrNull(masterBuilderUnlockedAt),
    },
    'crowd-favorite': {
      id: 'crowd-favorite',
      name: 'Crowd Favorite',
      description: "One of the user's posts received at least 50 likes",
      target: 50,
      progress: capped(context.maxLikes, 50),
      isUnlocked: context.maxLikes >= 50,
      unlockedAt: null,
    },
    'community-leader': {
      id: 'community-leader',
      name: 'Community Leader',
      description: "One of the user's posts received at least 25 comments",
      target: 25,
      progress: capped(context.maxComments, 25),
      isUnlocked: context.maxComments >= 25,
      unlockedAt: null,
    },
    'social-butterfly': {
      id: 'social-butterfly',
      name: 'Social Butterfly',
      description: 'Commented on 20 different community posts',
      target: 20,
      progress: capped(context.distinctCommentedPostsCount, 20),
      isUnlocked: context.distinctCommentedPostsCount >= 20,
      unlockedAt: null,
    },
    trendsetter: {
      id: 'trendsetter',
      name: 'Trendsetter',
      description: 'A user\'s post was featured on the homepage',
      target: 1,
      progress: context.hasFeaturedPersona ? 1 : 0,
      isUnlocked: context.hasFeaturedPersona,
      unlockedAt: null,
    },
  };

  return ACHIEVEMENT_DEFINITIONS.map((definition) => resultsById[definition.id]);
};
