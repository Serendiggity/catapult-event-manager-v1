#!/usr/bin/env node

import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Running database migrations...');
  
  // Create a postgres connection
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  
  try {
    // Run the Drizzle migrations
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, 'packages/server/drizzle') 
    });
    
    console.log('✅ Drizzle migrations completed successfully');
    
    // Now run the additional SQL migrations
    const additionalMigrations = [
      'add-confidence-scores.sql',
      'add-campaign-ai-fields.sql',
      'add-sender-variables.sql',
      'add-missing-fields.sql',
      'rename-lead-groups-to-campaign-groups.sql'
    ];
    
    for (const migration of additionalMigrations) {
      try {
        const migrationPath = path.join(__dirname, 'packages/server/src/db/migrations', migration);
        const { readFileSync } = await import('fs');
        const sql = readFileSync(migrationPath, 'utf8');
        
        console.log(`📝 Running migration: ${migration}`);
        await client.unsafe(sql);
        console.log(`✅ ${migration} completed`);
      } catch (error) {
        console.error(`⚠️  Error running ${migration}:`, error.message);
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('🎉 All migrations completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();