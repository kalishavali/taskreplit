import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Default to local PostgreSQL for development
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/projectmanager";

const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;

console.log(`🗃️  Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);

// Check if using Neon database (serverless)
const isNeonDatabase = databaseUrl.includes('neon.db') || databaseUrl.includes('neon.tech');

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;

if (isNeonDatabase) {
  // Use Neon serverless configuration
  neonConfig.webSocketConstructor = ws;
  const pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
  console.log('📡 Using Neon serverless database');
} else {
  // Use standard PostgreSQL configuration for local database
  const pool = new PgPool({ 
    connectionString: databaseUrl,
    // Additional local PostgreSQL configuration
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test the connection
  pool.on('connect', () => {
    console.log('🔗 Connected to local PostgreSQL database');
  });
  
  pool.on('error', (err) => {
    console.error('💥 PostgreSQL pool error:', err);
  });
  
  db = drizzlePg({ client: pool, schema });
  console.log('🐘 Using local PostgreSQL database');
}

export { db };