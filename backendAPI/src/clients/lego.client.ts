import axios from 'axios';

const LEGO_BASE_URL = process.env.LEGO_URL || 'http://legoservice:8004';
const LEGO_REQUEST_TIMEOUT_MS = Number(process.env.LEGO_REQUEST_TIMEOUT_MS || 180000);

export interface PersonaModuleInput {
  file_name: string;
  color: number;
}

export interface PersonaModulesInput {
  [key: string]: PersonaModuleInput;
}

export type PersonaGenerationResult = string | Buffer | { ldr_file?: string; [key: string]: unknown };

const now = (): number => Date.now();

const elapsedMs = (startedAt: number): number => Date.now() - startedAt;

const bufferByteLength = (data: unknown): number => {
  if (Buffer.isBuffer(data)) {
    return data.byteLength;
  }

  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }

  if (typeof data === 'string') {
    return Buffer.byteLength(data, 'utf-8');
  }

  return 0;
};

const logStart = (operation: string, details: Record<string, unknown>): number => {
  const startedAt = now();
  console.log(`[LegoClient] ${operation} started`, details);
  return startedAt;
};

const logSuccess = (operation: string, startedAt: number, details: Record<string, unknown>): void => {
  console.log(`[LegoClient] ${operation} succeeded in ${elapsedMs(startedAt)}ms`, details);
};

const logFailure = (operation: string, startedAt: number, details: Record<string, unknown>): void => {
  console.error(`[LegoClient] ${operation} failed after ${elapsedMs(startedAt)}ms`, details);
};

const formatAxiosError = (serviceName: string, error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;
    const timeout = error.config?.timeout;
    const axiosMessage = error.message;
    const responseData = error.response?.data;
    const details =
      typeof responseData === 'string'
        ? responseData
        : JSON.stringify(responseData || {});

    return new Error(
      `[${serviceName}] Request failed`
      + `${status ? ` with status ${status}` : ''}`
      + `${code ? ` [code=${code}]` : ''}`
      + `${typeof timeout === 'number' ? ` [timeoutMs=${timeout}]` : ''}`
      + `${axiosMessage ? `: ${axiosMessage}` : ''}`
      + `${details && details !== '{}' ? ` | response=${details}` : ''}`,
    );
  }

  return error instanceof Error
    ? new Error(`[${serviceName}] ${error.message}`)
    : new Error(`[${serviceName}] Unknown error`);
};

export const getInstructions = async (ldrFile: string): Promise<Buffer> => {
  const startedAt = logStart('getInstructions', {
    endpoint: `${LEGO_BASE_URL}/persona/instructions`,
    ldrLength: ldrFile.length,
  });

  try {
    const response = await axios.post<ArrayBuffer>(
      `${LEGO_BASE_URL}/persona/instructions`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    logSuccess('getInstructions', startedAt, {
      status: response.status,
      contentType: response.headers['content-type'],
      byteLength: bufferByteLength(response.data),
    });

    return Buffer.from(response.data);
  } catch (error) {
    logFailure('getInstructions', startedAt, {
      endpoint: `${LEGO_BASE_URL}/persona/instructions`,
      isAxiosError: axios.isAxiosError(error),
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      code: axios.isAxiosError(error) ? error.code : undefined,
      timeoutMs: axios.isAxiosError(error) ? error.config?.timeout : undefined,
      message: axios.isAxiosError(error) ? error.message : undefined,
      responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
    });
    throw formatAxiosError('Lego', error);
  }
};

export const getImage = async (ldrFile: string): Promise<Buffer> => {
  const startedAt = logStart('getImage', {
    endpoint: `${LEGO_BASE_URL}/persona/image`,
    ldrLength: ldrFile.length,
  });

  try {
    const response = await axios.post<ArrayBuffer>(
      `${LEGO_BASE_URL}/persona/image`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    logSuccess('getImage', startedAt, {
      status: response.status,
      contentType: response.headers['content-type'],
      byteLength: bufferByteLength(response.data),
    });

    return Buffer.from(response.data);
  } catch (error) {
    logFailure('getImage', startedAt, {
      endpoint: `${LEGO_BASE_URL}/persona/image`,
      isAxiosError: axios.isAxiosError(error),
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      code: axios.isAxiosError(error) ? error.code : undefined,
      timeoutMs: axios.isAxiosError(error) ? error.config?.timeout : undefined,
      message: axios.isAxiosError(error) ? error.message : undefined,
      responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
    });
    throw formatAxiosError('Lego', error);
  }
};

export const getCsv = async (ldrFile: string): Promise<string> => {
  const startedAt = logStart('getCsv', {
    endpoint: `${LEGO_BASE_URL}/persona/csv`,
    ldrLength: ldrFile.length,
  });

  try {
    const response = await axios.post<string>(
      `${LEGO_BASE_URL}/persona/csv`,
      { ldr_file: ldrFile },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'text', timeout: LEGO_REQUEST_TIMEOUT_MS },
    );

    logSuccess('getCsv', startedAt, {
      status: response.status,
      contentType: response.headers['content-type'],
      byteLength: bufferByteLength(response.data),
    });

    return response.data;
  } catch (error) {
    logFailure('getCsv', startedAt, {
      endpoint: `${LEGO_BASE_URL}/persona/csv`,
      isAxiosError: axios.isAxiosError(error),
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      code: axios.isAxiosError(error) ? error.code : undefined,
      timeoutMs: axios.isAxiosError(error) ? error.config?.timeout : undefined,
      message: axios.isAxiosError(error) ? error.message : undefined,
      responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
    });
    throw formatAxiosError('Lego', error);
  }
};

export const generatePersona = async (
  modulesObject: PersonaModulesInput,
  skinTone: number,
): Promise<PersonaGenerationResult> => {
  const endpoint = `${LEGO_BASE_URL}/persona/generate`;
  const startedAt = logStart('generatePersona', {
    endpoint,
    modulesCount: Object.keys(modulesObject).length,
    skinTone,
    moduleKeys: Object.keys(modulesObject),
  });

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
        logSuccess('generatePersona', startedAt, {
          status: response.status,
          contentType,
          responseBytes: bodyBuffer.byteLength,
          ldrLength: parsed.ldr_file.length,
          bodyKind: 'json',
        });
        return parsed;
      }
    }

    if (contentType.startsWith('text/')) {
      const textBody = bodyBuffer.toString('utf-8');
      logSuccess('generatePersona', startedAt, {
        status: response.status,
        contentType,
        responseBytes: bodyBuffer.byteLength,
        ldrLength: textBody.length,
        bodyKind: 'text',
      });
      return textBody;
    }

    logSuccess('generatePersona', startedAt, {
      status: response.status,
      contentType,
      responseBytes: bodyBuffer.byteLength,
      bodyKind: 'binary',
    });

    return bodyBuffer;
  } catch (error) {
    logFailure('generatePersona', startedAt, {
      endpoint,
      isAxiosError: axios.isAxiosError(error),
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      code: axios.isAxiosError(error) ? error.code : undefined,
      timeoutMs: axios.isAxiosError(error) ? error.config?.timeout : undefined,
      responseHeaders: axios.isAxiosError(error) ? error.response?.headers : undefined,
      responseData: axios.isAxiosError(error) ? error.response?.data : undefined,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw formatAxiosError('Lego', error);
  }
};
