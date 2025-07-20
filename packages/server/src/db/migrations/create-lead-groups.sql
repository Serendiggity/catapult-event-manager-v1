-- Create lead_groups table
CREATE TABLE IF NOT EXISTS lead_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  contact_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create contacts_to_lead_groups junction table
CREATE TABLE IF NOT EXISTS contacts_to_lead_groups (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  lead_group_id UUID NOT NULL REFERENCES lead_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (contact_id, lead_group_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_lead_groups_event_id ON lead_groups(event_id);
CREATE INDEX idx_contacts_to_lead_groups_group_id ON contacts_to_lead_groups(lead_group_id);
CREATE INDEX idx_contacts_to_lead_groups_contact_id ON contacts_to_lead_groups(contact_id);

-- Create trigger to update contact_count automatically
CREATE OR REPLACE FUNCTION update_lead_group_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lead_groups 
    SET contact_count = contact_count + 1 
    WHERE id = NEW.lead_group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lead_groups 
    SET contact_count = contact_count - 1 
    WHERE id = OLD.lead_group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_count_trigger
AFTER INSERT OR DELETE ON contacts_to_lead_groups
FOR EACH ROW
EXECUTE FUNCTION update_lead_group_contact_count();