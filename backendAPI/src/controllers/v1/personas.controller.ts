import { Request, Response } from 'express';
import { createPersonaFromImage, generatePersonaImage, generatePersonaInstructions } from '../../services/persona.service';

const generateBoundary = (): string => {
  return `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const createMultipartMixedResponse = (
  metadata: Record<string, unknown>,
  fileContent: string,
  filename: string,
): string => {
  const boundary = generateBoundary();
  const CRLF = '\r\n';
  const delimiterLine = `--${boundary}`;
  const closingDelimiterLine = `--${boundary}--`;

  // Part 1: JSON metadata
  const jsonPart = [
    delimiterLine,
    `Content-Type: application/json; charset=utf-8`,
    '',
    JSON.stringify(metadata, null, 2),
  ].join(CRLF);

  // Part 2: File content
  const filePart = [
    delimiterLine,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    fileContent,
  ].join(CRLF);

  // Construct full multipart body
  const body = [jsonPart, filePart, closingDelimiterLine].join(CRLF) + CRLF;

  return body;
};

const getMultipartContentType = (body: string): string => {
  const match = body.match(/^--boundary_(\d+_[a-z0-9]+)/);
  if (match) {
    return `multipart/mixed; boundary=boundary_${match[1]}`;
  }
  return 'multipart/mixed';
};

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

export const getPersonaInstructions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pdf = await generatePersonaInstructions(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="instructions.pdf"');
    res.status(200).send(pdf);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate instructions.';
    console.error('[PersonaController] Instructions generation failed:', error);
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 502).json({ message });
  }
};

export const getPersonaImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const png = await generatePersonaImage(id);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="model.png"');
    res.status(200).send(png);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate image.';
    console.error('[PersonaController] Image generation failed:', error);
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 502).json({ message });
  }
};

export const updatePersona = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};

export const deletePersona = (_req: Request, res: Response): void => {
  res.status(501).json({ message: 'Not implemented yet.' });
};