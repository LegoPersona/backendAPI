import { Types } from 'mongoose';
import { Persona, User } from '../models';
import { getCurrentUserProfile } from './profile.service';

const userId = '507f191e810c19729de860ea';

describe('profile.service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUserQuery = (user: unknown) => {
    const lean = jest.fn().mockResolvedValue(user);
    const select = jest.fn().mockReturnValue({ lean });
    jest.spyOn(User, 'findById').mockReturnValue({ select } as any);
  };

  const mockPersonaQuery = (personas: unknown[]) => {
    const lean = jest.fn().mockResolvedValue(personas);
    const sort = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ sort });
    return {
      findSpy: jest.spyOn(Persona, 'find').mockReturnValue({ select } as any),
      select,
      sort,
    };
  };

  it('returns authenticated user details and hides private fields', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek', password: 'hidden' });
    mockPersonaQuery([]);

    const profile = await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(profile.user).toEqual({ id: userId, username: 'ofek', profileImageUrl: null });
    expect((profile.user as any).password).toBeUndefined();
  });

  it('returns only personas owned by the authenticated user query', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    const { findSpy } = mockPersonaQuery([]);

    await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(findSpy).toHaveBeenCalledWith({ userId: new Types.ObjectId(userId) });
  });

  it('requests personas sorted newest first', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    const { sort } = mockPersonaQuery([]);

    await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns correct personasCount and image URLs', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    mockPersonaQuery([
      {
        _id: new Types.ObjectId('507f191e810c19729de860eb'),
        createdAt: new Date('2026-07-01T10:00:00.000Z'),
        partsJson: [],
        personaImage: '507f191e810c19729de860eb-persona.png',
      },
      {
        _id: new Types.ObjectId('507f191e810c19729de860ec'),
        createdAt: new Date('2026-07-02T10:00:00.000Z'),
        partsJson: [],
        personaImage: '507f191e810c19729de860ec-persona.png',
      },
    ]);

    const profile = await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(profile.stats.personasCount).toBe(2);
    expect(profile.personas[0].legoImageUrl).toBe('http://localhost:3000/personas/507f191e810c19729de860eb-persona.png');
    expect(profile.personas[1].legoImageUrl).toBe('http://localhost:3000/personas/507f191e810c19729de860ec-persona.png');
    expect(profile.personas[0].originalImageUrl).toBeNull();
  });

  it('returns correct partsCount using part quantities', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    mockPersonaQuery([
      {
        _id: new Types.ObjectId('507f191e810c19729de860eb'),
        createdAt: new Date('2026-07-01T10:00:00.000Z'),
        partsJson: [{ Quantity: '2' }, { qty: 3 }, { name: 'single-piece' }],
      },
    ]);

    const profile = await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(profile.personas[0].partsCount).toBe(6);
  });

  it('returns achievement progress from personas count', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    mockPersonaQuery([
      {
        _id: new Types.ObjectId('507f191e810c19729de860eb'),
        createdAt: new Date('2026-07-01T10:00:00.000Z'),
        partsJson: [],
      },
    ]);

    const profile = await getCurrentUserProfile(userId, 'http://localhost:3000');
    const brickStarter = profile.achievements.find((achievement) => achievement.id === 'brick-starter');

    expect(brickStarter).toEqual(
      expect.objectContaining({
        isUnlocked: true,
        progress: 1,
        target: 1,
      }),
    );
  });

  it('handles users with zero personas', async () => {
    mockUserQuery({ _id: new Types.ObjectId(userId), username: 'ofek' });
    mockPersonaQuery([]);

    const profile = await getCurrentUserProfile(userId, 'http://localhost:3000');

    expect(profile.stats.personasCount).toBe(0);
    expect(profile.personas).toEqual([]);
    expect(profile.achievements.find((achievement) => achievement.id === 'brick-starter')?.isUnlocked).toBe(false);
  });
});
