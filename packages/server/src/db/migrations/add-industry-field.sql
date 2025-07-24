-- Add industry field to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry text;

-- Add industry to field confidence scores
UPDATE contacts 
SET field_confidence_scores = jsonb_set(
  COALESCE(field_confidence_scores, '{}')::jsonb,
  '{industry}',
  '0'::jsonb
)
WHERE field_confidence_scores IS NOT NULL;