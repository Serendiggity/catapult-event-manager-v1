import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export async function initializeDatabase(retries = 3, retryDelay = 2000) {
  if (db) return db;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connecting to database... (attempt ${attempt}/${retries})`);
      
      client = postgres(connectionString, {
        connect_timeout: 10,
        max: 10,
        idle_timeout: 20,
        max_lifetime: 60 * 30, // 30 minutes
      });
      
      // Test the connection
      await client`SELECT 1`;
      console.log('Database connection successful');
      
      db = drizzle(client, { schema });
      return db;
    } catch (error) {
      lastError = error;
      console.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        // Exponential backoff for next retry
        retryDelay = Math.min(retryDelay * 2, 10000);
      }
      
      // Clean up failed connection
      if (client) {
        try {
          await client.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        client = null;
      }
    }
  }
  
  console.error('All database connection attempts failed');
  throw lastError;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}