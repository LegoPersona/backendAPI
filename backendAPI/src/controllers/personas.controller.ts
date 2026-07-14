import { randomUUID } from 'crypto';
import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { createPersonaFromImage, getPersonaImageFromDB, generatePersonaInstructions, getPersonasByUser, getPersonaByIdForUser, deletePersonaByIdForUser, getLegoPartsJson, getPersonaOriginalImageFromDB } from '../services/persona.service';
import { AuthenticatedRequest } from '../types';
import { GenerationTask, RateLimit } from '../models';
import config from '../config/env';

const runPersonaGenerationInBackground = async (
  jobId: string,
  userId: string,
  image: { buffer: Buffer; originalname?: string; mimetype?: string },
): Promise<void> => {
  try {
    await GenerationTask.findOneAndUpdate({ jobId }, { status: 'PROCESSING', percentCompleteEstimate: 0, errorMessage: undefined });

    const result = await createPersonaFromImage(image, userId, jobId);

    await GenerationTask.findOneAndUpdate(
      { jobId },
      { status: 'COMPLETED', percentCompleteEstimate: 100, resultPersonaId: result.id, errorMessage: undefined },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PersonaController] Background persona generation failed for jobId=${jobId}:`, error);
    await GenerationTask.findOneAndUpdate(
      { jobId },
      { status: 'FAILED', percentCompleteEstimate: 100, errorMessage: message, actionDescription: 'Failed' },
    );
  }
};

export const getPersonas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const host = req.get('host');
    const apiBaseUrl = host ? `${req.protocol}://${host}` : '';
    const personas = await getPersonasByUser(req.user!.userId, apiBaseUrl);
    res.status(200).json(personas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get personas.';
    res.status(500).json({ message });
  }
};

export const getPersonaById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const personaId = req.params.personaId ?? req.params.id;

  if (!isValidObjectId(personaId)) {
    res.status(400).json({ message: 'Invalid persona id.' });
    return;
  }

  const host = req.get('host');
  const apiBaseUrl = host ? `${req.protocol}://${host}` : '';

  try {
    const persona = await getPersonaByIdForUser(personaId, req.user!.userId, apiBaseUrl);
    if (!persona) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }

    res.status(200).json(persona);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get persona.';
    res.status(500).json({ message });
  }
};

export const getRateLimitStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const limit = config.DAILY_PERSONA_LIMIT;

    if (user.roles.includes('admin')) {
      res.status(200).json({ unlimited: true, limit, used: 0, remaining: limit, resetsAt: null });
      return;
    }

    const windowMs = 86400 * 1000;
    const record = await RateLimit.findOne({ userId: user.userId }).lean();

    // The TTL monitor may lag, so treat records past their window as expired.
    if (!record || record.windowStart.getTime() + windowMs <= Date.now()) {
      res.status(200).json({ unlimited: false, limit, used: 0, remaining: limit, resetsAt: null });
      return;
    }

    res.status(200).json({
      unlimited: false,
      limit,
      used: Math.min(record.count, limit),
      remaining: Math.max(limit - record.count, 0),
      resetsAt: new Date(record.windowStart.getTime() + windowMs).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rate limit status.';
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
      percentCompleteEstimate: 0,
      actionDescription: 'Starting...',
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
      .select('jobId status resultPersonaId errorMessage percentCompleteEstimate actionDescription')
      .lean();

    if (!task) {
      res.status(404).json({ message: 'Generation task not found.' });
      return;
    }

    res.status(200).json({
      jobId: task.jobId,
      status: task.status,
      percentCompleteEstimate: task.percentCompleteEstimate ?? 0,
      actionDescription: task.actionDescription ?? null,
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
    const id = req.params.personaId ?? req.params.id;
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

export const getPersonaOriginalImage = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.personaId ?? req.params.id

    if (!isValidObjectId(id)) {
      res.status(404).json({ message: 'Persona not found.' })
      return
    }

    const originalImage = await getPersonaOriginalImageFromDB(
      id,
      req.user!.userId,
    )

    res.setHeader('Content-Type', originalImage.mimeType)
    res.status(200).send(originalImage.buffer)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get original image.'

    console.error(
      '[PersonaController] Original image retrieval failed:',
      error,
    )

    res
      .status(
        error instanceof Error && error.message.includes('not found')
          ? 404
          : 502,
      )
      .json({ message })
  }
}

export const getPersonaImage = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.personaId ?? req.params.id

    if (!isValidObjectId(id)) {
      res.status(404).json({ message: 'Persona not found.' })
      return
    }

    const legoImage = await getPersonaImageFromDB(
      id,
      req.user!.userId,
    )

    res.setHeader('Content-Type', legoImage.mimeType)
    res.status(200).send(legoImage.buffer)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get image.'

    console.error(
      '[PersonaController] Image retrieval failed:',
      error,
    )

    res
      .status(
        error instanceof Error && error.message.includes('not found')
          ? 404
          : 502,
      )
      .json({ message })
  }
}

export const getPersonaLegoPartsJson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(404).json({ message: 'Persona not found.' });
      return;
    }
    const parts = await getLegoPartsJson(id, req.user!.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="lego-parts.json"');
    res.status(200).send(JSON.stringify(parts, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get lego parts.';
    console.error('[PersonaController] Lego parts retrieval failed:', error);
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 502).json({ message });
  }
};

export const updatePersona = (_req: AuthenticatedRequest, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const deletePersona = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personaId = req.params.personaId ?? req.params.id;

    if (!isValidObjectId(personaId)) {
      res.status(400).json({ message: 'Invalid persona id.' });
      return;
    }

    const deleted = await deletePersonaByIdForUser(personaId, req.user!.userId);

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


