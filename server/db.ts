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

// Use IPv6 address directly since DNS resolution works for IPv6
const supabaseUrlIpv6 = "postgresql://postgres:ojSfaUO2ftS3Cobd@[2406:da1a:6b0:f60c:e6f4:7269:b8bd:43a7]:5432/postgres";
const supabaseUrlHost = "postgresql://postgres:ojSfaUO2ftS3Cobd@db.wjhbttuvsehawslpbgai.supabase.co:5432/postgres";
const databaseUrl = supabaseUrlIpv6;

console.log(`🗃️  Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

// Detect database provider based on URL
const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('2406:da1a:6b0:f60c:e6f4:7269:b8bd:43a7');
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