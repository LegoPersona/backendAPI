import { getCurrentUserProfileController } from './users.controller';
import * as profileService from '../services/profile.service';
import { AuthenticatedRequest } from '../types';

const mockResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  return res;
};

describe('getCurrentUserProfileController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 without authentication', async () => {
    const req = {
      user: undefined,
      get: jest.fn(),
      headers: {},
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getCurrentUserProfileController(req, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized.' });
  });

  it('returns profile response for authenticated user', async () => {
    jest.spyOn(profileService, 'getCurrentUserProfile').mockResolvedValue({
      user: { id: 'user-1', username: 'ofek' },
      stats: { personasCount: 1, unlockedAchievementsCount: 1, totalAchievementsCount: 6 },
      personas: [],
      achievements: [],
    });

    const req = {
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
      get: jest.fn().mockReturnValue('localhost:3000'),
      headers: {},
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getCurrentUserProfileController(req, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ username: 'ofek' }),
      }),
    );
  });
});
