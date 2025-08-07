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

// Use your Neon database connection as requested
const databaseUrl = "postgresql://neondb_owner:npg_2aY4QCTmXiyu@ep-polished-frog-ad6yqbvq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log(`🗃️  Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

// Detect database provider based on URL
const isSupabase = databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co');
const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('aws.neon.tech');
const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;
let pool: NeonPool | PgPool;

if (isSupabase) {
  console.log('🟢 Using Supabase PostgreSQL database');
  // Use standard PostgreSQL driver for Supabase
  // Use IPv6 connection with SSL
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: { 
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 45000,
    application_name: 'replit-taskloop-app',
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