import { getDb, initializeDatabase } from './src/db/connection';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function runMigration() {
  console.log('Running sender_variables migration...');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    // Add sender_variables column to email_campaigns table
    await db.execute(sql`
      ALTER TABLE email_campaigns 
      ADD COLUMN IF NOT EXISTS sender_variables jsonb DEFAULT '{}'::jsonb
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();