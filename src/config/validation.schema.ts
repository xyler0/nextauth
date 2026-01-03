import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // GitHub
  GITHUB_WEBHOOK_SECRET: Joi.string().required(),
  GITHUB_MODE: Joi.string().valid('webhook', 'polling').default('webhook'),
  
  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  OPENAI_TEMPERATURE: Joi.number().min(0).max(2).default(0.3),
  
  // Posting Rules
  MAX_POSTS_PER_DAY: Joi.number().min(1).max(10).default(3),
  
  // Security
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  
  // JWT
  JWT_SECRET: Joi.string().required(),

  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CALLBACK_URL: Joi.string().optional(),
  
  // Twitter OAuth
  TWITTER_CONSUMER_KEY: Joi.string().optional(),
  TWITTER_CONSUMER_SECRET: Joi.string().optional(),
  TWITTER_CALLBACK_URL: Joi.string().optional(),
  
  // Frontend
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

});