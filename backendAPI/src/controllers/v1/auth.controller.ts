import { Request, Response } from 'express';

export const register = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const login = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const getCurrentUser = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};