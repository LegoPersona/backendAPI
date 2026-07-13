export interface PublicUserProfile {
  id: string;
  username: string;
  email?: string;
}

export interface ProfileStats {
  personasCount: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
}

export interface ProfilePersonaSummary {
  id: string;
  createdAt: Date;
  partsCount: number;
  originalImageUrl: string | null;
  legoImageUrl: string | null;
}

export interface AchievementResponse {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

export interface CurrentUserProfileResponse {
  user: PublicUserProfile;
  stats: ProfileStats;
  personas: ProfilePersonaSummary[];
  achievements: AchievementResponse[];
}

export interface PersonaDetailResponse {
  id: string;
  createdAt: Date;
  attributes: Record<string, unknown>;
  modules: Record<string, { file_name: string; color: number }>;
  partsJson: Record<string, unknown>[];
  partsCount: number;
  originalImageUrl: string | null;
  legoImageUrl: string | null;
  modelUrl: string | null;
  instructionsUrl: string | null;
}
