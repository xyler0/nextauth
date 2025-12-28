import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // GitHub
  GITHUB_WEBHOOK_SECRET: Joi.string().required(),
  GITHUB_MODE: Joi.string().valid('webhook', 'polling').default('webhook'),
  
  // Posting Rules
  MAX_POSTS_PER_DAY: Joi.number().min(1).max(10).default(3),
  
  // Security
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
});