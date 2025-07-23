-- Rename lead groups to campaign groups
-- This migration renames tables and columns to match the new terminology

-- Rename lead_groups table to campaign_groups
ALTER TABLE IF EXISTS lead_groups RENAME TO campaign_groups;

-- Rename contacts_to_lead_groups table to contacts_to_campaign_groups
ALTER TABLE IF EXISTS contacts_to_lead_groups RENAME TO contacts_to_campaign_groups;

-- Rename column in the junction table
ALTER TABLE IF EXISTS contacts_to_campaign_groups 
  RENAME COLUMN lead_group_id TO campaign_group_id;

-- Rename column in the campaign_groups table (previously campaign_groups with different purpose)
-- First, check if the old campaign_groups table exists and rename it to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_groups' AND table_name != 'campaign_groups') THEN
    -- The junction table for campaigns to groups needs to be renamed
    ALTER TABLE campaign_groups RENAME TO campaign_group_assignments;
    ALTER TABLE campaign_group_assignments RENAME COLUMN lead_group_id TO campaign_group_id;
  END IF;
END $$;

-- Update any foreign key constraints
ALTER TABLE IF EXISTS contacts_to_campaign_groups
  DROP CONSTRAINT IF EXISTS contacts_to_lead_groups_lead_group_id_fkey;

ALTER TABLE IF EXISTS contacts_to_campaign_groups
  ADD CONSTRAINT contacts_to_campaign_groups_campaign_group_id_fkey 
  FOREIGN KEY (campaign_group_id) 
  REFERENCES campaign_groups(id) 
  ON DELETE CASCADE;

-- Update campaign_group_assignments if it exists
ALTER TABLE IF EXISTS campaign_group_assignments
  DROP CONSTRAINT IF EXISTS campaign_groups_lead_group_id_fkey;

ALTER TABLE IF EXISTS campaign_group_assignments
  ADD CONSTRAINT campaign_group_assignments_campaign_group_id_fkey 
  FOREIGN KEY (campaign_group_id) 
  REFERENCES campaign_groups(id) 
  ON DELETE CASCADE;