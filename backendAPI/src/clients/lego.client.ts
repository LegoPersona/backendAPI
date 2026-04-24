import axios from 'axios';

const LEGO_URL = 'http://localhost:8010/persona/generate';

export interface PersonaModulesInput {
  hair_color: string;
  skin_tone: string;
  glasses: string;
  beard: string;
}

export type PersonaGenerationResult = string | Buffer;

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
    const response = await axios.post<ArrayBuffer>(LEGO_URL, modulesObject, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const bodyBuffer = Buffer.from(response.data);

    if (contentType.includes('application/json')) {
      const parsed = JSON.parse(bodyBuffer.toString('utf-8')) as { url?: string };
      if (typeof parsed.url === 'string' && parsed.url.length > 0) {
        return parsed.url;
      }
    }

    if (contentType.startsWith('text/')) {
      const textBody = bodyBuffer.toString('utf-8').trim();
      if (/^https?:\/\//i.test(textBody)) {
        return textBody;
      }
    }

    return bodyBuffer;
  } catch (error) {
    throw formatAxiosError('Lego', error);
  }
};
