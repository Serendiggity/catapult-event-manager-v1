import express from 'express';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// One-time migration endpoint (remove after use)
router.post('/run-migrations-once', async (req, res) => {
  // Simple security check - require a token
  const token = req.headers['x-migration-token'];
  if (token !== 'catapult-migration-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  console.log('🔄 Running database migrations via admin endpoint...');
  
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  
  const results: any[] = [];
  
  try {
    // Check existing migrations
    try {
      const result = await client`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'drizzle_migrations'
      `;
      
      if (result[0].count > 0) {
        const migrations = await client`SELECT COUNT(*) as count FROM drizzle_migrations`;
        results.push({ step: 'check_migrations', status: 'success', count: migrations[0].count });
      }
    } catch (e) {
      results.push({ step: 'check_migrations', status: 'no_existing' });
    }
    
    // Run Drizzle migrations
    try {
      await migrate(db, { 
        migrationsFolder: path.join(process.cwd(), 'packages/server/drizzle') 
      });
      results.push({ step: 'drizzle_migrations', status: 'success' });
    } catch (error: any) {
      if (error.code === '42P07' || error.message?.includes('already exists')) {
        results.push({ step: 'drizzle_migrations', status: 'already_exists' });
      } else {
        throw error;
      }
    }
    
    // Run additional SQL migrations
    const additionalMigrations = [
      'add-confidence-scores.sql',
      'add-campaign-ai-fields.sql',
      'add-sender-variables.sql',
      'add-missing-fields.sql',
      'rename-lead-groups-to-campaign-groups.sql'
    ];
    
    for (const migration of additionalMigrations) {
      try {
        const migrationPath = path.join(process.cwd(), 'packages/server/src/db/migrations', migration);
        const sql = await fs.readFile(migrationPath, 'utf8');
        
        await client.unsafe(sql);
        results.push({ step: migration, status: 'success' });
      } catch (error: any) {
        results.push({ step: migration, status: 'error', message: error.message });
      }
    }
    
    // Create quick add event
    try {
      const { createQuickAddEvent } = await import('../db/migrations/create-quick-add-event');
      await createQuickAddEvent();
      results.push({ step: 'quick_add_event', status: 'success' });
    } catch (error: any) {
      results.push({ step: 'quick_add_event', status: 'error', message: error.message });
    }
    
    await client.end();
    
    return res.json({
      success: true,
      message: 'Migrations completed',
      results
    });
    
  } catch (error: any) {
    await client.end();
    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
});

export default router;