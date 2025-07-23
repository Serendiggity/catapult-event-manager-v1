import { initializeDatabase } from './connection';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    const db = await initializeDatabase();
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add-campaign-ai-fields.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('Running migration...');
    await db.execute(sql);
    console.log('Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();