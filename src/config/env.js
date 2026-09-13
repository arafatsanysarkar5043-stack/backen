import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(10),
  JWT_SECRET: z.string().min(32),
  DB_PEPPER: z.string().min(32),
  MONITOR_SECRET: z.string().min(32),
  FRONTEND_ORIGIN: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12),
  MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(1500000)
});

export const env = schema.parse(process.env);
