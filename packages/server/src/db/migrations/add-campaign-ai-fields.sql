-- Add AI-related fields to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS enabled_variables JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_chat_history JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the fields
COMMENT ON COLUMN email_campaigns.enabled_variables IS 'List of variable names that AI should use for personalization';
COMMENT ON COLUMN email_campaigns.ai_chat_history IS 'Chat history with AI assistant during campaign creation';