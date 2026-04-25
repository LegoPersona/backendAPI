import axios from 'axios';

const EMBEDDING_URL = process.env.EMBEDDING_URL || 'http://embedding:8003/embed';

export interface EmbeddingResponse {
  embedding: number[];
}

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

export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await axios.post<EmbeddingResponse>(
      EMBEDDING_URL,
      { text },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      },
    );

    return response.data.embedding;
  } catch (error) {
    throw formatAxiosError('Embedding', error);
  }
};
