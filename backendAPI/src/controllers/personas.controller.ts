import { randomUUID } from 'crypto';
import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { createPersonaFromImage, getPersonaImageFromDB, generatePersonaInstructions, getPersonasByUser } from '../services/persona.service';
import { AuthenticatedRequest } from '../types';
import { GenerationTask, Persona } from '../models';

const runPersonaGenerationInBackground = async (
  jobId: string,
  userId: string,
  image: { buffer: Buffer; originalname?: string; mimetype?: string },
): Promise<void> => {
  try {
    await GenerationTask.findOneAndUpdate({ jobId }, { status: 'PROCESSING', errorMessage: undefined });

    const result = await createPersonaFromImage(image, userId);

    await GenerationTask.findOneAndUpdate(
      { jobId },
      { status: 'COMPLETED', resultPersonaId: result.id, errorMessage: undefined },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PersonaController] Background persona generation failed for jobId=${jobId}:`, error);
    await GenerationTask.findOneAndUpdate(
      { jobId },
      { status: 'FAILED', errorMessage: message },
    );
  }
};

export const getPersonas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personas = await getPersonasByUser(req.user!.userId);
    const result = personas.map((p) => ({
      id: p._id.toString(),
      attributes: p.attributes,
      modules: p.modules,
      createdAt: p.createdAt,
      partsJson: p.partsJson,
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
      .select('attributes modules createdAt partsJson')
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
      partsJson: persona.partsJson,
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

    const jobId = randomUUID();

    await GenerationTask.create({
      jobId,
      status: 'PENDING',
    });

    const imageInput = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    };

    // Fire-and-forget background processing after acknowledging task creation.
    void runPersonaGenerationInBackground(jobId, req.user!.userId, imageInput)
      .catch((backgroundError) => {
        console.error(
          `[PersonaController] Unhandled background error for jobId=${jobId}:`,
          backgroundError,
        );
      });

    res.status(202).json({ jobId, status: 'PENDING' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create persona.';
    console.error('[PersonaController] Persona creation failed:', error);
    res.status(502).json({ message });
  }
};

export const getPersonaGenerationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const task = await GenerationTask.findOne({ jobId })
      .select('jobId status resultPersonaId errorMessage')
      .lean();

    if (!task) {
      res.status(404).json({ message: 'Generation task not found.' });
      return;
    }

    res.status(200).json({
      jobId: task.jobId,
      status: task.status,
      resultPersonaId: task.resultPersonaId ? task.resultPersonaId.toString() : null,
      errorMessage: task.errorMessage ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get generation status.';
    res.status(500).json({ message });
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
    const png = await getPersonaImageFromDB(id, req.user!.userId);
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(png);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get image.';
    console.error('[PersonaController] Image retrieval failed:', error);
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
