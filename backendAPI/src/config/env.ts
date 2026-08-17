import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  DAILY_PERSONA_LIMIT: Number(process.env.DAILY_PERSONA_LIMIT) || 5,
  APPROVED_SKIN_TONES: process.env.APPROVED_SKIN_TONES
    ? process.env.APPROVED_SKIN_TONES.split(',').map(Number)
    : [19, 226, 142, 86, 70, 134, 308, 217, 125, 68],
  NUM_COLOR_CANDIDATES: Number(process.env.NUM_COLOR_CANDIDATES) || 2,
  // GCS bucket holding publicly-served images (persona renders, original photos, profile pics).
  GCS_PUBLIC_BUCKET: process.env.GCS_PUBLIC_BUCKET || 'legopersona-pub',
  // GCS bucket holding private, server-only assets (generated model .ldr files, module templates).
  GCS_ASSETS_BUCKET: process.env.GCS_ASSETS_BUCKET || 'legopersona-priv',
  // Optional CDN/base host for public objects. When unset, storage.googleapis.com is used.
  GCS_PUBLIC_BASE_URL: process.env.GCS_PUBLIC_BASE_URL || '',
};

export default config;