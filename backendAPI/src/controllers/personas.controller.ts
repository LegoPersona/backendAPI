import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { createPersonaFromImage, generatePersonaImage, generatePersonaInstructions, getPersonasByUser } from '../services/persona.service';
import { AuthenticatedRequest } from '../types';
import { Persona } from '../models';
import { createMultipartMixedResponse, getMultipartContentType } from '../utils';

export const getPersonas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personas = await getPersonasByUser(req.user!.userId);
    const result = personas.map((p) => ({
      id: p._id.toString(),
      attributes: p.attributes,
      modules: p.modules,
      createdAt: p.createdAt,
    }));
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get personas.';
    res.status(500).json({ message });
  }
};

export const getPersonaById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Persona not found.' });
    return;
  }
  try {
    const persona = await Persona.findOne({ _id: req.params.id, userId: req.user!.userId })
      .select('attributes modules createdAt')
      .lean();
    if (!persona) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    res.status(200).json({
      id: persona._id.toString(),
      attributes: persona.attributes,
      modules: persona.modules,
      createdAt: persona.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get persona.';
    res.status(500).json({ message });
  }
};

export const createPersona = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    }, req.user!.userId);

    const metadata = {
      id: result.id,
      message: 'Persona generated successfully.',
      generated_at: new Date().toISOString(),
      filename: 'persona.ldr',
      selectedModules: result.modules,
    };

    const multipartBody = createMultipartMixedResponse(
      metadata,
      result.legoResult,
      'persona.ldr',
    );

    const contentType = getMultipartContentType(multipartBody);

    res.setHeader('Content-Type', contentType);
    res.status(200).send(multipartBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create persona.';
    console.error('[PersonaController] Persona creation failed:', error);
    res.status(502).json({ message });
  }
};

export const getPersonaInstructions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    const pdf = await generatePersonaInstructions(id, req.user!.userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="instructions.pdf"');
    res.status(200).send(pdf);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate instructions.';
    console.error('[PersonaController] Instructions generation failed:', error);
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 502).json({ message });
  }
};

export const getPersonaImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    const png = await generatePersonaImage(id, req.user!.userId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="model.png"');
    res.status(200).send(png);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate image.';
    console.error('[PersonaController] Image generation failed:', error);
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 502).json({ message });
  }
};

export const updatePersona = (_req: AuthenticatedRequest, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const deletePersona = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    const deleted = await Persona.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!deleted) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete persona.';
    res.status(500).json({ message });
  }
};
