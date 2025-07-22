import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please set your Supabase database connection string.",
  );
}

// Force Supabase connection - override any system DATABASE_URL
const databaseUrl = "postgresql://postgres:ojSfaUO2ftS3Cobd@db.wjhbttuvsehawslpbgai.supabase.co:5432/postgres";

console.log(`🗃️  Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

// Detect database provider based on URL
const isSupabase = databaseUrl.includes('supabase.co');
const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('aws.neon.tech');
const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;
let pool: NeonPool | PgPool;

if (isSupabase) {
  console.log('🟢 Using Supabase PostgreSQL database');
  // Use standard PostgreSQL driver for Supabase
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 5, // Reduce connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increase timeout
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
  db = drizzlePg({ client: pool, schema });
} else if (isNeon) {
  console.log('📡 Using Neon serverless database');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
} else if (isLocal) {
  console.log('🐘 Using local PostgreSQL database');
  pool = new PgPool({ 
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  db = drizzlePg({ client: pool, schema });
} else {
  console.log('🗃️  Using standard PostgreSQL database');
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('ssl=true') ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  db = drizzlePg({ client: pool, schema });
}

export { db, pool };