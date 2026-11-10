require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'quizpulse_super_secret_access_key_2026_jwt',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'quizpulse_super_secret_refresh_key_2026_jwt',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  ENABLE_AI_QUESTION_STUB: process.env.ENABLE_AI_QUESTION_STUB === 'true',
};
