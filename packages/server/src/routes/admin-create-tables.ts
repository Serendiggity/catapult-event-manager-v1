import express from 'express';
import postgres from 'postgres';

const router = express.Router();

// Create only the missing tables
router.post('/create-missing-tables', async (req, res) => {
  const token = req.headers['x-migration-token'];
  if (token !== 'catapult-migration-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const results: any[] = [];

  try {
    // 1. Create events table
    try {
      await client`
        CREATE TABLE IF NOT EXISTS "events" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "title" text NOT NULL,
          "description" text,
          "location" text,
          "date" timestamp NOT NULL,
          "capacity" integer,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      results.push({ table: 'events', status: 'created' });
    } catch (error: any) {
      results.push({ table: 'events', status: 'error', message: error.message });
    }

    // 2. Create campaign_groups table (formerly lead_groups)
    try {
      await client`
        CREATE TABLE IF NOT EXISTS "campaign_groups" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "event_id" uuid NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
        )
      `;
      results.push({ table: 'campaign_groups', status: 'created' });
    } catch (error: any) {
      results.push({ table: 'campaign_groups', status: 'error', message: error.message });
    }

    // 3. Create campaigns table
    try {
      await client`
        CREATE TABLE IF NOT EXISTS "campaigns" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "event_id" uuid NOT NULL,
          "campaign_group_id" uuid NOT NULL,
          "name" text NOT NULL,
          "subject" text NOT NULL,
          "template_body" text NOT NULL,
          "variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
          "status" text DEFAULT 'draft' NOT NULL,
          "sender_email" text DEFAULT 'noreply@example.com' NOT NULL,
          "sender_name" text DEFAULT 'Your Company' NOT NULL,
          "ai_model" text DEFAULT 'gpt-4o' NOT NULL,
          "ai_instructions" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
          FOREIGN KEY ("campaign_group_id") REFERENCES "campaign_groups"("id") ON DELETE CASCADE
        )
      `;
      results.push({ table: 'campaigns', status: 'created' });
    } catch (error: any) {
      results.push({ table: 'campaigns', status: 'error', message: error.message });
    }

    // 4. Create event_campaigns junction table
    try {
      await client`
        CREATE TABLE IF NOT EXISTS "event_campaigns" (
          "contact_id" uuid NOT NULL,
          "campaign_group_id" uuid NOT NULL,
          "added_at" timestamp DEFAULT now() NOT NULL,
          PRIMARY KEY ("contact_id", "campaign_group_id")
        )
      `;
      results.push({ table: 'event_campaigns', status: 'created' });
    } catch (error: any) {
      results.push({ table: 'event_campaigns', status: 'error', message: error.message });
    }

    // 5. Add missing columns to existing contacts table
    try {
      // Check which columns already exist
      const existingColumns = await client`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND table_schema = 'public'
      `;
      
      const columnNames = existingColumns.map(c => c.column_name);
      
      // Add event_id if missing
      if (!columnNames.includes('event_id')) {
        await client`ALTER TABLE contacts ADD COLUMN event_id uuid`;
        results.push({ action: 'add_column', column: 'event_id', status: 'added' });
      }
      
      // Add other missing columns
      const columnsToAdd = [
        { name: 'ocr_confidence', type: 'numeric(3, 2)' },
        { name: 'needs_review', type: 'boolean DEFAULT false NOT NULL' },
        { name: 'raw_ocr_data', type: 'text' },
        { name: 'image_url', type: 'text' }
      ];
      
      for (const col of columnsToAdd) {
        if (!columnNames.includes(col.name)) {
          await client`ALTER TABLE contacts ADD COLUMN ${client(col.name)} ${client.unsafe(col.type)}`;
          results.push({ action: 'add_column', column: col.name, status: 'added' });
        }
      }
      
    } catch (error: any) {
      results.push({ table: 'contacts_columns', status: 'error', message: error.message });
    }

    // 6. Create the quick add event
    try {
      const QUICK_ADD_EVENT_ID = '00000000-0000-4000-8000-000000000001';
      await client`
        INSERT INTO events (id, title, description, location, date, capacity)
        VALUES (
          ${QUICK_ADD_EVENT_ID},
          'Quick Add Leads',
          'For leads collected outside of formal events',
          'Various',
          '2025-01-01T00:00:00Z',
          9999
        )
        ON CONFLICT (id) DO NOTHING
      `;
      results.push({ action: 'quick_add_event', status: 'created' });
    } catch (error: any) {
      results.push({ action: 'quick_add_event', status: 'error', message: error.message });
    }

    await client.end();

    return res.json({
      success: true,
      message: 'Missing tables created',
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