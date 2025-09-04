import 'server-only';
export const runtime = 'node';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

// Initialize the postgres client with Supabase-compatible settings
const client = postgres(process.env.DATABASE_URL!, { 
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Initialize Drizzle with the client and schema
export const db = drizzle(client, { schema });
