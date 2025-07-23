# Email Campaign Features - Setup Guide

## Overview
The Catapult Event Manager has full email campaign functionality implemented, including:
- AI-powered email draft generation using OpenAI
- Template variable substitution ({{firstName}}, {{company}}, etc.)
- CSV export for Gmail Mail Merge
- Direct email sending from the application

## Setup Requirements

### 1. OpenAI API Key (Required for AI Generation)
Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Email Sending Configuration (Required for Direct Sending)
Configure SMTP settings in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use that password in SMTP_PASS

## How to Use Email Campaigns

### 1. Create a Campaign
1. Go to Events → Select an event → Email Campaigns
2. Click "Create Campaign"
3. Enter campaign details and email template
4. Use variables like {{firstName}}, {{company}}, {{eventName}}
5. Select lead groups to target

### 2. Generate AI Drafts
1. Open a campaign from the campaigns list
2. Click "Generate Drafts" button
3. The system will:
   - Replace template variables with contact data
   - Use OpenAI to enhance and personalize each email
   - Create individual drafts for each contact

### 3. Review and Approve Drafts
1. Review each generated draft
2. Click "Approve" for good drafts or "Reject" for ones to skip
3. You can preview the full email before approving

### 4. Export for Gmail Mail Merge
1. After approving drafts, click "Export CSV"
2. The CSV includes all contact data and personalized email content
3. Use with Gmail Mail Merge add-on or similar tools

### 5. Direct Email Sending
1. Click "Send" on individual approved drafts
2. Or use "Send All" to send all approved drafts at once
3. Requires SMTP configuration (see above)

## Available Template Variables
- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{email}}` - Contact's email
- `{{company}}` - Contact's company
- `{{position}}` - Contact's job title
- `{{phone}}` - Contact's phone number
- `{{website}}` - Contact's website
- `{{notes}}` - Any notes about the contact
- `{{eventName}}` - Name of the event
- `{{eventDate}}` - Date of the event

## Troubleshooting

### "Email generation service is not available"
- Make sure OPENAI_API_KEY is set in .env
- Restart the server after adding the key

### "Failed to send email"
- Check SMTP configuration in .env
- Verify app password is correct
- Check that less secure app access is enabled (if not using app password)

### No drafts appearing
- Ensure the campaign has lead groups assigned
- Check that the lead groups have contacts
- Look for errors in the server console