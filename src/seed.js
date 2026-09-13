import argon2 from 'argon2';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import User from './models/User.js';
import { securePayload } from './utils/modelSecurity.js';
await connectDB();
const email = env.ADMIN_EMAIL.toLowerCase();
const existing = await User.findOne({ email });
if (!existing) {
  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const base = { email, name: 'ZAFRIVA Admin', passwordHash, role: 'admin', permissions: ['*'], active: true, createdAt: new Date(), updatedAt: new Date() };
  await User.create(securePayload(base));
  console.log(`Admin created: ${email}`);
} else console.log('Admin already exists');
process.exit(0);
