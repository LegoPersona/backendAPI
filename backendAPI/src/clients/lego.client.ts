import axios from 'axios';

const LEGO_URL = 'http://localhost:8004/persona/generate';

export interface PersonaModulesInput {
  [key: string]: string;
}

export type PersonaGenerationResult = string | Buffer | { ldr_file?: string; [key: string]: unknown };

const formatAxiosError = (serviceName: string, error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const details =
      typeof responseData === 'string'
        ? responseData
        : JSON.stringify(responseData || {});

    return new Error(
      `[${serviceName}] Request failed${status ? ` with status ${status}` : ''}: ${details || error.message}`,
    );
  }

  return error instanceof Error
    ? new Error(`[${serviceName}] ${error.message}`)
    : new Error(`[${serviceName}] Unknown error`);
};

export const generatePersona = async (
  modulesObject: PersonaModulesInput,
): Promise<PersonaGenerationResult> => {
  try {
    console.log('Modules object:', modulesObject);
    const response = await axios.post<ArrayBuffer>(LEGO_URL, { persona: modulesObject }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 30000,
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
    throw formatAxiosError('Lego', error);
  }
};
