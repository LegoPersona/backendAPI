import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const isDnsResolutionError = (error: unknown): error is NodeJS.ErrnoException => {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && ['ENOTFOUND', 'EAI_AGAIN'].includes(String((error as NodeJS.ErrnoException).code))
  );
};

const buildDnsResolutionHint = (mongoUri: string, error: NodeJS.ErrnoException): string => {
  try {
    const { hostname } = new URL(mongoUri);

    if (hostname === 'mongod' || hostname.endsWith('.search-community')) {
      return [
        `MongoDB hostname \"${hostname}\" could not be resolved (${error.code}).`,
        'This backend is running on your macOS host, not inside the Docker network.',
        'Use localhost or 127.0.0.1 when connecting through the published port 27017.',
      ].join(' ');
    }

    return `MongoDB hostname \"${hostname}\" could not be resolved (${error.code}).`;
  } catch {
    return `MongoDB hostname could not be resolved (${error.code}).`;
  }
};

const buildMongoUri = (): string => {
  return process.env.MONGO_URL || '';
};

export const connectDB = async (): Promise<void> => {
  const mongoUri = buildMongoUri();

  if (!mongoUri) {
    const message = 'MongoDB connection failed: MONGO_URL is not set.';
    console.error(message);
    throw new Error(message);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    if (isDnsResolutionError(error)) {
      console.error(buildDnsResolutionHint(mongoUri, error));
    }

    console.error('MongoDB connection failed:', error);
    throw error;
  }
};
