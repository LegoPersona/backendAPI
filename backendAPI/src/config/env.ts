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
};

export default config;