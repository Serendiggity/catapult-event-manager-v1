# Email Campaign Generation Test Plan

## Prerequisites
1. Ensure the application is running (`npm run dev`)
2. Have at least one event created
3. Have at least one lead group with contacts
4. Set the `OPENAI_API_KEY` environment variable (optional - UI will show appropriate error if not set)

## Test Steps

### 1. Create an Email Campaign
1. Navigate to an event
2. Click "Email Campaigns"
3. Click "New Campaign"
4. Enter campaign details:
   - Name: "Follow-up Campaign"
   - Subject: "Great meeting you at {{eventName}}"
   - Template Body:
   ```
   Hi {{firstName}},

   It was wonderful meeting you at {{eventName}}. I really enjoyed our conversation about {{company}}.

   I'd love to continue our discussion and explore how we might work together.

   Best regards,
   [Your Name]
   ```
5. Select one or more lead groups
6. Click "Create Campaign"

### 2. Verify Variable Detection
- Check that the campaign card shows the detected variables: `{{firstName}}`, `{{eventName}}`, `{{company}}`

### 3. Test Draft Generation
1. Click "View" on the campaign
2. Click "Generate Drafts"
3. If OPENAI_API_KEY is not set:
   - Verify that an appropriate error message is shown
4. If OPENAI_API_KEY is set:
   - Wait for generation to complete
   - Verify that drafts are created for each contact in the selected lead groups
   - Preview drafts to ensure variables are replaced correctly
   - Check that AI has enhanced the emails while maintaining the original intent

### 4. Test Draft Management
1. Preview individual drafts
2. Approve/Reject drafts
3. Verify status changes are reflected in the UI

## Expected Results
- Campaign creation should work smoothly
- Variables should be automatically detected from the template
- Without OpenAI API key: Clear error message when attempting to generate
- With OpenAI API key: Personalized drafts for each contact
- Draft preview and status management should work correctly

## Database Verification
Run these queries to verify data integrity:

```sql
-- Check campaigns
SELECT * FROM email_campaigns;

-- Check campaign groups
SELECT * FROM campaign_groups;

-- Check email drafts
SELECT * FROM email_drafts;
```