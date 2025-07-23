-- Add missing fields to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add completedAt field to email_campaigns table
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update status enum to include 'sending' and 'failed'
-- First, we need to create a new enum type with all values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_campaign_status_new') THEN
        CREATE TYPE email_campaign_status_new AS ENUM ('draft', 'generating', 'ready', 'sending', 'sent', 'failed');
    END IF;
END $$;

-- Update the column to use the new enum (if the column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_campaigns' 
        AND column_name = 'status'
    ) THEN
        -- Alter the column to use the new enum type
        ALTER TABLE email_campaigns 
        ALTER COLUMN status TYPE email_campaign_status_new 
        USING status::text::email_campaign_status_new;
        
        -- Drop the old enum type if it exists
        DROP TYPE IF EXISTS email_campaign_status;
        
        -- Rename the new enum type to the standard name
        ALTER TYPE email_campaign_status_new RENAME TO email_campaign_status;
    END IF;
END $$;