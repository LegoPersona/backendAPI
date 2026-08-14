import axios from 'axios';

const LEGO_BASE_URL = process.env.LEGO_URL || 'http://legoservice:8004';
const LEGO_REQUEST_TIMEOUT_MS = Number(process.env.LEGO_REQUEST_TIMEOUT_MS || 180000);

export interface PersonaModuleInput {
  file_name: string;
  color: number;
  secondary_color?: number;
}

export interface PersonaModulesInput {
  [key: string]: PersonaModuleInput;
}

export type PersonaGenerationResult = string | Buffer | { ldr_file?: string; [key: string]: unknown };

const formatAxiosError = (operation: string, error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;
    const message = error.message;

    return new Error(
      `${operation} failed: ${message}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`,
    );
  }

  return error instanceof Error
    ? new Error(`${operation} failed: ${error.message}`)
    : new Error(`${operation} failed: Unknown error`);
};

export const getInstructions = async (ldrFile: string): Promise<Buffer> => {
  try {
    const response = await axios.post<ArrayBuffer>(
      `${LEGO_BASE_URL}/persona/instructions`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    return Buffer.from(response.data);
  } catch (error) {
    throw formatAxiosError('getInstructions', error);
  }
};

export const getImage = async (ldrFile: string): Promise<Buffer> => {
  try {
    const response = await axios.post<ArrayBuffer>(
      `${LEGO_BASE_URL}/persona/image`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    return Buffer.from(response.data);
  } catch (error) {
    throw formatAxiosError('getImage', error);
  }
};

export const getCsv = async (ldrFile: string): Promise<string> => {
  try {
    const response = await axios.post<string>(
      `${LEGO_BASE_URL}/persona/csv`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'text', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    return response.data;
  } catch (error) {
    throw formatAxiosError('getCsv', error);
  }
};

export const generatePersona = async (
  modulesObject: PersonaModulesInput,
  skinTone: number,
): Promise<PersonaGenerationResult> => {
  const endpoint = `${LEGO_BASE_URL}/persona/generate`;

  try {
    const response = await axios.post<ArrayBuffer>(endpoint, { persona: { ...modulesObject, skin_tone: skinTone } }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: LEGO_REQUEST_TIMEOUT_MS,
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const bodyBuffer = Buffer.from(response.data);

    if (contentType.includes('application/json')) {
      const parsed = JSON.parse(bodyBuffer.toString('utf-8')) as {
        ldr_file?: string;
        [key: string]: unknown;
      };
      if (typeof parsed.ldr_file === 'string' && parsed.ldr_file.length > 0) {
        return parsed;
      }
    }

    if (contentType.startsWith('text/')) {
      return bodyBuffer.toString('utf-8');
    }

    return bodyBuffer;
  } catch (error) {
    throw formatAxiosError('generatePersona', error);
  }
};
