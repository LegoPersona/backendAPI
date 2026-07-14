export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  target: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'brick-starter',
    name: 'Brick Starter',
    description: 'Created your first LEGO Persona',
    target: 1,
  },
  {
    id: 'master-builder',
    name: 'Master Builder',
    description: 'Created your 10th LEGO Persona',
    target: 10,
  },
  {
    id: 'crowd-favorite',
    name: 'Crowd Favorite',
    description: "One of the user's posts received at least 50 likes",
    target: 50,
  },
  {
    id: 'community-leader',
    name: 'Community Leader',
    description: "One of the user's posts received at least 25 comments",
    target: 25,
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Commented on 20 different community posts',
    target: 20,
  },
  {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'A user\'s post was featured on the homepage',
    target: 1,
  },
];
