import axios from 'axios';
import FormData from 'form-data';

const FACE_LLM_URL = 'http://localhost:8020/api/v1/extract-attributes';

export interface AttributesType {
  beard: string;
  eyebrows: string;
  eyes: string;
  hair: string;
  nose: string;
  pants: string;
  shirt: string;
  hair_color?: string;
  skin_tone?: string;
  glasses?: string;
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
  console.log('Selected mock index:', index);
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
    console.log('Using mock FaceLLM response');
    return getRandomMockResponse();
  }

  const formData = new FormData();
  formData.append('image', image, {
    filename: 'image.jpg',
    contentType: 'application/octet-stream',
  });

  try {
    console.log('Calling real FaceLLM service');
    const response = await axios.post<AttributesType>(FACE_LLM_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error('FaceLLM failed, falling back to mock', formatAxiosError('FaceLLM', error));
    return getRandomMockResponse();
  }
};
