import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const verifySchema = async () => {
  console.log('Verifying database schema...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = postgres(connectionString);

  try {
    // Query to list all tables in the public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('\nTables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Check specific tables
    const expectedTables = [
      'events',
      'contacts', 
      'lead_groups',
      'contacts_to_lead_groups',
      'email_campaigns',
      'email_drafts',
      'activity_logs'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('\n✅ All expected tables exist!');
    } else {
      console.log('\n❌ Missing tables:', missingTables);
    }

    // Check a few key constraints
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;

    console.log(`\nForeign key constraints: ${constraints.length} found`);

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

verifySchema();