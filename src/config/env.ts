import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  NODE_ENV:z.string(),
});

const _env = envSchema.safeParse(process.env);

if(!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
} 

export const env = _env.data;

