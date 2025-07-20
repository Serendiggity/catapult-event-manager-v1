-- Add column to store individual field confidence scores
ALTER TABLE contacts 
ADD COLUMN field_confidence_scores JSONB;

-- Add column to store the address field if extracted
ALTER TABLE contacts
ADD COLUMN address TEXT;

-- Add index on needs_review for efficient querying
CREATE INDEX idx_contacts_needs_review ON contacts(needs_review) WHERE needs_review = true;