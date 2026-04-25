import axios from 'axios';
import FormData from 'form-data';

const FACE_LLM_URL = process.env.FACELLM_URL || 'http://facellm:8002/api/v1/extract-attributes';

export interface AttributesType {
  beard: string;
  eyebrows: string;
  eyes: string;
  hair: string;
  nose: string;
  pants: string;
  shirt: string;
}

const mockResponses: AttributesType[] = [
  {
    beard: 'no_beard',
    eyebrows: 'black round eyebrows',
    eyes: 'brown eyes',
    hair: 'no hair',
    nose: 'round nose',
    pants: 'blue pants',
    shirt: 'red shirt',
  },
  {
    beard: 'brown beard',
    eyebrows: 'thick black eyebrows',
    eyes: 'green eyes',
    hair: 'short black hair',
    nose: 'small nose',
    pants: 'black pants',
    shirt: 'white shirt',
  },
  {
    beard: 'no_beard',
    eyebrows: 'thin eyebrows',
    eyes: 'blue eyes',
    hair: 'long blonde hair',
    nose: 'pointy nose',
    pants: 'gray pants',
    shirt: 'yellow shirt',
  },
  {
    beard: 'red beard',
    eyebrows: 'red eyebrows',
    eyes: 'hazel eyes',
    hair: 'curly red hair',
    nose: 'wide nose',
    pants: 'green pants',
    shirt: 'black shirt',
  },
];

const getRandomMockResponse = (): AttributesType => {
  const index = Math.floor(Math.random() * mockResponses.length);
  console.log('[FaceLLM] Selected mock index:', index);
  return mockResponses[index];
};

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

export const extractAttributes = async (image: Buffer): Promise<AttributesType> => {
  if (process.env.USE_MOCK_FACELLM === 'true') {
    console.log('[FaceLLM] Using MOCK mode (USE_MOCK_FACELLM=true)');
    return getRandomMockResponse();
  }

  console.log('[FaceLLM] Using REAL service');

  const formData = new FormData();
  formData.append('image_file', image, {
    filename: 'image.jpg',
    contentType: 'image/jpeg',
  });

  try {
    const response = await axios.post<AttributesType>(FACE_LLM_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    const formatted = formatAxiosError('FaceLLM', error);
    console.error('[FaceLLM] Request failed:', formatted.message);
    throw new Error(`[FaceLLM] Request failed: ${formatted.message}`);
  }
};
