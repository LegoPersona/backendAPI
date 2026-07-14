import { promises as fs } from 'fs';
import path from 'path';

/** Root public directory, served statically by app.ts. Matches ./public relative to the process cwd. */
export const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/** Sub-directory (under public) where persona-related images are stored and served from (/personas/<file>). */
export const PERSONA_IMAGE_SUBDIR = 'personas';

const personaImagesDir = path.join(PUBLIC_DIR, PERSONA_IMAGE_SUBDIR);

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Resolves a file extension (without dot) from a mimetype, falling back to an original filename, then to png. */
export const resolveImageExtension = (mimetype?: string, originalname?: string): string => {
  if (mimetype && MIME_EXTENSIONS[mimetype.toLowerCase()]) {
    return MIME_EXTENSIONS[mimetype.toLowerCase()];
  }
  const ext = originalname ? path.extname(originalname).replace('.', '').toLowerCase() : '';
  return ext || 'png';
};

/** Writes an image buffer into public/personas and returns the stored filename. */
export const savePersonaImage = async (filename: string, data: Buffer): Promise<string> => {
  await fs.mkdir(personaImagesDir, { recursive: true });
  await fs.writeFile(path.join(personaImagesDir, filename), data);
  return filename;
};

/** Reads a persona image from disk by its stored filename. */
export const readPersonaImage = async (filename: string): Promise<Buffer> =>
  fs.readFile(path.join(personaImagesDir, filename));

/** Deletes a persona image by filename. Missing files are ignored. */
export const deletePersonaImage = async (filename?: string): Promise<void> => {
  if (!filename) return;
  await fs.rm(path.join(personaImagesDir, filename), { force: true });
};
