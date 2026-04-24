import { Request, Response } from 'express';
import { createPersonaFromImage } from '../../services/persona.service';

export const listPersonas = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const getPersonaById = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const createPersona = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Image file is required (multipart field: image).' });
      return;
    }

    console.log('[PersonaController] Starting persona creation request');
    const result = await createPersonaFromImage({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    if (typeof result.legoResult === 'string') {
      res.status(200).json({
        message: 'Persona generated successfully.',
        selectedModules: result.modules,
        generatedLdr: {
          type: 'url',
          value: result.legoResult,
        },
      });
      return;
    }

    res.status(200).json({
      message: 'Persona generated successfully.',
      selectedModules: result.modules,
      generatedLdr: {
        type: 'base64',
        value: result.legoResult.toString('base64'),
        encoding: 'base64',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create persona.';
    console.error('[PersonaController] Persona creation failed:', error);
    res.status(502).json({ message });
  }
};

export const updatePersona = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const deletePersona = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};