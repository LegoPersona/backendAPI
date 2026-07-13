import { getPersonaById, deletePersona } from './personas.controller';
import { AuthenticatedRequest } from '../types';
import * as personaService from '../services/persona.service';

const mockResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  };

  res.status.mockReturnValue(res);
  return res;
};

describe('personas.controller ownership', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('owner can retrieve persona', async () => {
    jest.spyOn(personaService, 'getPersonaByIdForUser').mockResolvedValue({
      id: '507f191e810c19729de860eb',
      createdAt: new Date('2026-07-01T10:00:00.000Z'),
      attributes: {},
      modules: {},
      partsJson: [],
      partsCount: 0,
      originalImageUrl: null,
      legoImageUrl: null,
      modelUrl: null,
      instructionsUrl: null,
    });

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
      get: jest.fn().mockReturnValue('localhost:3000'),
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getPersonaById(req, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('another user cannot retrieve the persona', async () => {
    jest.spyOn(personaService, 'getPersonaByIdForUser').mockResolvedValue(null);

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ff', username: 'other', roles: [] },
      get: jest.fn().mockReturnValue('localhost:3000'),
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getPersonaById(req, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('invalid ObjectId returns 400 for get persona', async () => {
    const req = {
      params: { personaId: 'not-an-object-id' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
      get: jest.fn().mockReturnValue('localhost:3000'),
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getPersonaById(req, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('missing persona returns 404', async () => {
    jest.spyOn(personaService, 'getPersonaByIdForUser').mockResolvedValue(null);

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
      get: jest.fn().mockReturnValue('localhost:3000'),
      protocol: 'http',
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await getPersonaById(req, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('owner can delete the persona and record removal is invoked', async () => {
    const deleteSpy = jest.spyOn(personaService, 'deletePersonaByIdForUser').mockResolvedValue(true);

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await deletePersona(req, res as any);

    expect(deleteSpy).toHaveBeenCalledWith('507f191e810c19729de860eb', '507f191e810c19729de860ea');
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('another user cannot delete the persona', async () => {
    jest.spyOn(personaService, 'deletePersonaByIdForUser').mockResolvedValue(false);

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ff', username: 'other', roles: [] },
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await deletePersona(req, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('missing persona returns 404 on delete', async () => {
    jest.spyOn(personaService, 'deletePersonaByIdForUser').mockResolvedValue(false);

    const req = {
      params: { personaId: '507f191e810c19729de860eb' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await deletePersona(req, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('invalid ObjectId returns 400 for delete', async () => {
    const req = {
      params: { personaId: 'invalid-object-id' },
      user: { userId: '507f191e810c19729de860ea', username: 'ofek', roles: [] },
    } as unknown as AuthenticatedRequest;
    const res = mockResponse();

    await deletePersona(req, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
