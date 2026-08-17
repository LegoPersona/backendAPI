import { Types } from 'mongoose';
import { IPersonaComment, LegoColor, Persona, User } from '../models';
import { publicUrl, resolveProfileImageUrl } from '../utils';

export type CommunitySort = 'newest' | 'popularity' | 'most-discussed';

export interface CommunityGalleryQuery {
  sort: CommunitySort;
  skip: number;
  limit: number;
  hairColors?: number[];
  skinTones?: number[];
  hasGlasses?: boolean;
  hasBeard?: boolean;
}

export interface CommunityCommentResponse {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface CommunityPersonaResponse {
  id: string;
  user: { id: string; username: string; profileImageUrl: string | null };
  createdAt: string;
  legoImageUrl: string | null;
  originalImageUrl: string | null;
  tags: string[];
  likes: number;
  isLikedByUser: boolean;
  comments: CommunityCommentResponse[];
}

export interface CommunityColorOption {
  legoColorId: number;
  name: string;
  hex: string;
}

export interface CommunityFilterOptionsResponse {
  hairColors: CommunityColorOption[];
  skinTones: CommunityColorOption[];
}

/** Persona shape returned by the gallery aggregation. */
interface GalleryPersonaRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  modules: Record<string, { file_name: string; color: number }>;
  personaImage?: string;
  originalImage?: string;
  skinTone?: number;
  likes?: Types.ObjectId[];
  comments?: IPersonaComment[];
  createdAt: Date;
}

interface UserRecord {
  _id: Types.ObjectId;
  username: string;
  profileImageUrl?: string | null;
}

const toImageUrl = (key?: string): string | null => publicUrl(key);

const SORT_STAGES: Record<CommunitySort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  popularity: { likesCount: -1, createdAt: -1 },
  'most-discussed': { commentsCount: -1, createdAt: -1 },
};

// Personas always carry a glasses/beard module; the "none" case is stored as no_glasses.ldr / no_beard.ldr.
const NO_GLASSES_MODULE = 'no_glasses.ldr';
const NO_BEARD_MODULE = 'no_beard.ldr';

const moduleMatch = (noModuleFileName: string, has: boolean): Record<string, unknown> =>
  has ? { $exists: true, $ne: noModuleFileName } : { $in: [null, noModuleFileName] };

const buildGalleryMatch = (query: CommunityGalleryQuery): Record<string, unknown> => {
  const match: Record<string, unknown> = {};
  if (query.hairColors?.length) match['modules.hair.color'] = { $in: query.hairColors };
  if (query.skinTones?.length) match.skinTone = { $in: query.skinTones };
  if (query.hasGlasses !== undefined)
    match['modules.glasses.file_name'] = moduleMatch(NO_GLASSES_MODULE, query.hasGlasses);
  if (query.hasBeard !== undefined)
    match['modules.beard.file_name'] = moduleMatch(NO_BEARD_MODULE, query.hasBeard);
  return match;
};

const notFound = (): Error => Object.assign(new Error('Persona not found.'), { status: 404 });

export const getCommunityGallery = async (
  currentUserId: string,
  query: CommunityGalleryQuery,
): Promise<{ total: number; personas: CommunityPersonaResponse[] }> => {
  const match = buildGalleryMatch(query);

  const [total, personas] = await Promise.all([
    Persona.countDocuments(match),
    Persona.aggregate<GalleryPersonaRecord>([
      { $match: match },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      { $sort: SORT_STAGES[query.sort] },
      { $skip: query.skip },
      { $limit: query.limit },
      { $project: { attributes: 0, legoFile: 0, partsJson: 0, likesCount: 0, commentsCount: 0 } },
    ]),
  ]);

  // Resolve author and commenter usernames with one batched query.
  const userIds = new Set<string>();
  for (const persona of personas) {
    userIds.add(persona.userId.toString());
    for (const comment of persona.comments ?? []) {
      userIds.add(comment.userId.toString());
    }
  }
  const users = await User.find({ _id: { $in: [...userIds].map((id) => new Types.ObjectId(id)) } })
    .select('username profileImageUrl')
    .lean<UserRecord[]>();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  // Resolve LEGO color names for tags with one batched query.
  const colorIds = new Set<number>();
  for (const persona of personas) {
    if (typeof persona.modules?.hair?.color === 'number') colorIds.add(persona.modules.hair.color);
    if (typeof persona.skinTone === 'number') colorIds.add(persona.skinTone);
  }
  const colors = await LegoColor.find({ legoColorId: { $in: [...colorIds] } })
    .select('legoColorId name')
    .lean<{ legoColorId: number; name: string }[]>();
  const colorNamesById = new Map(colors.map((color) => [color.legoColorId, color.name]));

  const buildTags = (persona: GalleryPersonaRecord): string[] => {
    const tags: string[] = [];
    const hairColorId = persona.modules?.hair?.color;
    const hairName = typeof hairColorId === 'number' ? colorNamesById.get(hairColorId) : undefined;
    if (hairName) tags.push(`${hairName} Hair`);
    const glassesFile = persona.modules?.glasses?.file_name;
    if (glassesFile && glassesFile !== NO_GLASSES_MODULE) tags.push('Glasses');
    const beardFile = persona.modules?.beard?.file_name;
    if (beardFile && beardFile !== NO_BEARD_MODULE) tags.push('Beard');
    const skinName = typeof persona.skinTone === 'number' ? colorNamesById.get(persona.skinTone) : undefined;
    if (skinName) tags.push(`${skinName} Skin`);
    return tags;
  };

  const mapComment = (comment: IPersonaComment): CommunityCommentResponse => ({
    id: comment._id.toString(),
    userId: comment.userId.toString(),
    username: usersById.get(comment.userId.toString())?.username ?? 'Unknown',
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  });

  return {
    total,
    personas: personas.map((persona) => {
      const author = usersById.get(persona.userId.toString());
      return {
        id: persona._id.toString(),
        user: {
          id: persona.userId.toString(),
          username: author?.username ?? 'Unknown',
          profileImageUrl: resolveProfileImageUrl(author?.profileImageUrl),
        },
        createdAt: persona.createdAt.toISOString(),
        legoImageUrl: toImageUrl(persona.personaImage),
        originalImageUrl: toImageUrl(persona.originalImage),
        tags: buildTags(persona),
        likes: persona.likes?.length ?? 0,
        isLikedByUser: (persona.likes ?? []).some((id) => id.toString() === currentUserId),
        comments: (persona.comments ?? []).map(mapComment),
      };
    }),
  };
};

export const getCommunityFilterOptions = async (): Promise<CommunityFilterOptionsResponse> => {
  // distinct() infers its type from the Mixed schema path; the runtime values are numbers.
  const [hairColorIds, skinToneIds]: [unknown[], unknown[]] = await Promise.all([
    Persona.distinct('modules.hair.color'),
    Persona.distinct('skinTone'),
  ]);

  const isColorId = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
  const hairIds = hairColorIds.filter(isColorId);
  const skinIds = skinToneIds.filter(isColorId);

  const colors = await LegoColor.find({ legoColorId: { $in: [...new Set([...hairIds, ...skinIds])] } })
    .select('legoColorId name hex')
    .lean<CommunityColorOption[]>();
  const colorsById = new Map(colors.map((color) => [color.legoColorId, color]));

  const toOptions = (ids: number[]): CommunityColorOption[] =>
    ids
      .map((id) => colorsById.get(id))
      .filter((color): color is CommunityColorOption => Boolean(color))
      .map(({ legoColorId, name, hex }) => ({ legoColorId, name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name));

  return { hairColors: toOptions(hairIds), skinTones: toOptions(skinIds) };
};

const applyLikeUpdate = async (
  personaId: string,
  update: Record<string, unknown>,
): Promise<number> => {
  const updated = await Persona.findByIdAndUpdate(personaId, update, { new: true })
    .select('likes')
    .lean<{ likes?: Types.ObjectId[] } | null>();
  if (!updated) throw notFound();
  return updated.likes?.length ?? 0;
};

export const likePersona = async (
  personaId: string,
  currentUserId: string,
): Promise<{ likes: number; isLikedByUser: boolean }> => {
  const likes = await applyLikeUpdate(personaId, {
    $addToSet: { likes: new Types.ObjectId(currentUserId) },
  });
  return { likes, isLikedByUser: true };
};

export const unlikePersona = async (
  personaId: string,
  currentUserId: string,
): Promise<{ likes: number; isLikedByUser: boolean }> => {
  const likes = await applyLikeUpdate(personaId, {
    $pull: { likes: new Types.ObjectId(currentUserId) },
  });
  return { likes, isLikedByUser: false };
};

export const addCommunityComment = async (
  personaId: string,
  currentUserId: string,
  text: string,
): Promise<CommunityCommentResponse> => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw Object.assign(new Error('Comment text is required.'), { status: 400 });
  }
  if (trimmed.length > 500) {
    throw Object.assign(new Error('Comment text must be 500 characters or less.'), { status: 400 });
  }

  const comment = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(currentUserId),
    text: trimmed,
    createdAt: new Date(),
  };

  const updated = await Persona.findByIdAndUpdate(
    personaId,
    { $push: { comments: comment } },
    { new: true },
  )
    .select('_id')
    .lean();
  if (!updated) throw notFound();

  const author = await User.findById(currentUserId).select('username').lean<{ username: string } | null>();

  return {
    id: comment._id.toString(),
    userId: currentUserId,
    username: author?.username ?? 'Unknown',
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
};
