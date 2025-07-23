-- Safely rename lead groups to campaign groups
-- This migration handles the existing campaign_groups junction table

-- First, rename the existing campaign_groups table to campaign_group_assignments
ALTER TABLE campaign_groups RENAME TO campaign_group_assignments;

-- Rename lead_groups to campaign_groups
ALTER TABLE lead_groups RENAME TO campaign_groups;

-- Rename contacts_to_lead_groups to contacts_to_campaign_groups
ALTER TABLE contacts_to_lead_groups RENAME TO contacts_to_campaign_groups;

-- Rename columns in the junction tables
ALTER TABLE contacts_to_campaign_groups 
  RENAME COLUMN lead_group_id TO campaign_group_id;

ALTER TABLE campaign_group_assignments
  RENAME COLUMN lead_group_id TO campaign_group_id;

-- Update foreign key constraints for contacts_to_campaign_groups
ALTER TABLE contacts_to_campaign_groups
  DROP CONSTRAINT IF EXISTS contacts_to_lead_groups_lead_group_id_fkey;

ALTER TABLE contacts_to_campaign_groups
  ADD CONSTRAINT contacts_to_campaign_groups_campaign_group_id_fkey 
  FOREIGN KEY (campaign_group_id) 
  REFERENCES campaign_groups(id) 
  ON DELETE CASCADE;

-- Update foreign key constraints for campaign_group_assignments
ALTER TABLE campaign_group_assignments
  DROP CONSTRAINT IF EXISTS campaign_groups_lead_group_id_fkey;

ALTER TABLE campaign_group_assignments
  ADD CONSTRAINT campaign_group_assignments_campaign_group_id_fkey 
  FOREIGN KEY (campaign_group_id) 
  REFERENCES campaign_groups(id) 
  ON DELETE CASCADE;