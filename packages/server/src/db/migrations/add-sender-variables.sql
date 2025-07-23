-- Add sender_variables column to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN sender_variables jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN email_campaigns.sender_variables IS 'Stores sender information variables like name, company, position, etc. as key-value pairs';