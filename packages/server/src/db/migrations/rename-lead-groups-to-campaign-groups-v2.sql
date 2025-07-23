-- Rename lead groups to campaign groups
-- This migration handles the case where campaign_groups already exists

-- First drop the existing campaign_groups table if it exists (it's the old junction table)
DROP TABLE IF EXISTS campaign_groups CASCADE;

-- Now rename lead_groups to campaign_groups
ALTER TABLE lead_groups RENAME TO campaign_groups;

-- Rename the junction table
ALTER TABLE contacts_to_lead_groups RENAME TO contacts_to_campaign_groups;

-- Rename the column in the junction table
ALTER TABLE contacts_to_campaign_groups 
  RENAME COLUMN lead_group_id TO campaign_group_id;

-- Update foreign key constraints
ALTER TABLE contacts_to_campaign_groups
  DROP CONSTRAINT IF EXISTS contacts_to_lead_groups_lead_group_id_fkey;

ALTER TABLE contacts_to_campaign_groups
  ADD CONSTRAINT contacts_to_campaign_groups_campaign_group_id_fkey 
  FOREIGN KEY (campaign_group_id) 
  REFERENCES campaign_groups(id) 
  ON DELETE CASCADE;