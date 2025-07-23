import { Router } from 'express';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { emailCampaigns, campaignGroupAssignments, emailDrafts, campaignGroups, contactsToCampaignGroups, contacts, emailDraftVersions } from '../db/schema';
import type { EmailCampaign, NewEmailCampaign, CampaignGroupAssignment, NewCampaignGroupAssignment } from '../db/schema';
import { EmailGenerator } from '../services/email-generation/email-generator';
import { EmailSender } from '../services/email/email-sender';

const router = Router();
let emailGenerator: EmailGenerator | null = null;
let emailSender: EmailSender | null = null;

// Lazy initialization of email generator
function getEmailGenerator(): EmailGenerator {
  if (!emailGenerator) {
    emailGenerator = new EmailGenerator();
  }
  return emailGenerator;
}

// Lazy initialization of email sender
function getEmailSender(): EmailSender {
  if (!emailSender) {
    emailSender = new EmailSender();
  }
  return emailSender;
}

// Get all campaigns (across all events)
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await getDb().query.emailCampaigns.findMany({
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    res.json({
      success: true,
      data: campaigns,
      message: 'Campaigns retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching all campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get all email campaigns for an event
router.get('/events/:eventId/campaigns', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const campaigns = await getDb().query.emailCampaigns.findMany({
      where: eq(emailCampaigns.eventId, eventId),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    // Return campaigns directly without groups for now
    res.json({
      success: true,
      campaigns: campaigns,
      message: 'Campaigns retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching campaigns for event:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get a single campaign
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await getDb().query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get campaign groups for the campaign
    const groups = await getDb()
      .select({
        campaignGroup: campaignGroups,
      })
      .from(campaignGroupAssignments)
      .innerJoin(campaignGroups, eq(campaignGroups.id, campaignGroupAssignments.campaignGroupId))
      .where(eq(campaignGroupAssignments.campaignId, campaign.id));

    res.json({
      ...campaign,
      campaignGroups: groups.map(g => g.campaignGroup),
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create a new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { eventId, name, subject, templateBody, variables, senderVariables, campaignGroupIds, aiChatHistory } = req.body;

    // Create the campaign
    const [campaign] = await getDb().insert(emailCampaigns).values({
      eventId,
      name,
      subject,
      templateBody,
      variables: variables || [],
      enabledVariables: variables || [], // By default, all detected variables are enabled
      senderVariables: senderVariables || {},
      aiChatHistory: aiChatHistory || [],
    }).returning();

    // Associate campaign groups
    if (campaignGroupIds && campaignGroupIds.length > 0) {
      await getDb().insert(campaignGroupAssignments).values(
        campaignGroupIds.map((campaignGroupId: string) => ({
          campaignId: campaign.id,
          campaignGroupId,
        }))
      );
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update a campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, templateBody, variables, campaignGroupIds } = req.body;

    // Update the campaign
    const [updatedCampaign] = await getDb()
      .update(emailCampaigns)
      .set({
        name,
        subject,
        templateBody,
        variables: variables || [],
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, id))
      .returning();

    if (!updatedCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update campaign group associations if provided
    if (campaignGroupIds !== undefined) {
      // Remove existing associations
      await getDb().delete(campaignGroupAssignments).where(eq(campaignGroupAssignments.campaignId, id));

      // Add new associations
      if (campaignGroupIds.length > 0) {
        await getDb().insert(campaignGroupAssignments).values(
          campaignGroupIds.map((campaignGroupId: string) => ({
            campaignId: id,
            campaignGroupId,
          }))
        );
      }
    }

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete a campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedCampaign] = await getDb()
      .delete(emailCampaigns)
      .where(eq(emailCampaigns.id, id))
      .returning();

    if (!deletedCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Get email drafts for a campaign
router.get('/campaigns/:id/drafts', async (req, res) => {
  try {
    const { id } = req.params;

    const drafts = await getDb().query.emailDrafts.findMany({
      where: eq(emailDrafts.campaignId, id),
      orderBy: (drafts, { desc }) => [desc(drafts.generatedAt)],
    });

    res.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Extract variables from template
router.post('/campaigns/extract-variables', async (req, res) => {
  try {
    const { templateBody } = req.body;

    // Extract variables in the format {{variable_name}}
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(templateBody)) !== null) {
      variables.add(match[1]);
    }

    res.json({ variables: Array.from(variables) });
  } catch (error) {
    console.error('Error extracting variables:', error);
    res.status(500).json({ error: 'Failed to extract variables' });
  }
});

// Refine template with AI based on user prompt
router.post('/campaigns/refine-template', async (req, res) => {
  try {
    const { prompt, currentTemplate, enabledVariables, context, enabledSenderVariables } = req.body;

    try {
      getEmailGenerator(); // Test if we can initialize
    } catch (error) {
      return res.status(503).json({ error: 'AI service is not available. Please configure OPENAI_API_KEY.' });
    }

    const result = await getEmailGenerator().refineTemplate(
      prompt,
      currentTemplate,
      enabledVariables,
      context,
      enabledSenderVariables
    );

    res.json(result);
  } catch (error) {
    console.error('Error refining template:', error);
    res.status(500).json({ error: 'Failed to refine template' });
  }
});

// Generate drafts for a campaign
router.post('/campaigns/:id/generate-drafts', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if campaign exists
    const campaign = await getDb().query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    try {
      getEmailGenerator(); // Test if we can initialize
    } catch (error) {
      return res.status(503).json({ error: 'Email generation service is not available. Please configure OPENAI_API_KEY.' });
    }

    // Generate drafts asynchronously
    getEmailGenerator().generateDraftsForCampaign(id).catch(error => {
      console.error('Error in background draft generation:', error);
    });

    res.json({ message: 'Draft generation started', campaignId: id });
  } catch (error) {
    console.error('Error starting draft generation:', error);
    res.status(500).json({ error: 'Failed to start draft generation' });
  }
});

// Generate a single draft preview
router.post('/campaigns/:id/preview-draft', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    try {
      getEmailGenerator(); // Test if we can initialize
    } catch (error) {
      return res.status(503).json({ error: 'Email generation service is not available. Please configure OPENAI_API_KEY.' });
    }

    const draft = await getEmailGenerator().generateSingleDraft(id, contactId);
    res.json(draft);
  } catch (error) {
    console.error('Error generating draft preview:', error);
    res.status(500).json({ error: 'Failed to generate draft preview' });
  }
});

// Create quick campaign (direct email without groups)
router.post('/campaigns/quick', async (req, res) => {
  try {
    const { eventId, name, subject, templateBody, contactIds, sendImmediately } = req.body;
    
    if (!eventId || !subject || !templateBody || !contactIds || contactIds.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventId, subject, templateBody, and contactIds are required' 
      });
    }

    const db = getDb();
    
    // Create the campaign
    const [campaign] = await db.insert(emailCampaigns).values({
      eventId,
      name: name || `Quick email - ${new Date().toLocaleString()}`,
      subject,
      templateBody,
      status: sendImmediately ? 'sending' : 'draft',
      recipientCount: contactIds.length,
      aiProvider: 'none',
      enableLeadVariables: true,
      enableEventVariables: true,
      enableSenderVariables: true,
      useSenderVariables: false,
      sendTime: sendImmediately ? new Date() : null,
    }).returning();

    // Generate and send drafts if immediate send is requested
    if (sendImmediately) {
      try {
        const emailService = getEmailSender();
        
        // Create drafts for each contact
        const draftPromises = contactIds.map(async (contactId: string) => {
          // Get contact details
          const contact = await db.query.contacts.findFirst({
            where: eq(contacts.id, contactId)
          });
          
          if (!contact) return null;
          
          // Simple variable replacement
          let personalizedBody = templateBody;
          personalizedBody = personalizedBody.replace(/\{firstName\}/g, contact.firstName || '');
          personalizedBody = personalizedBody.replace(/\{lastName\}/g, contact.lastName || '');
          personalizedBody = personalizedBody.replace(/\{company\}/g, contact.company || '');
          
          // Create draft
          const [draft] = await db.insert(emailDrafts).values({
            campaignId: campaign.id,
            contactId,
            subject,
            body: personalizedBody,
            status: 'approved',
            approvedAt: new Date(),
          }).returning();
          
          return draft;
        });
        
        const drafts = (await Promise.all(draftPromises)).filter(Boolean);
        
        // Send emails
        const sendPromises = drafts.map(async (draft) => {
          if (!draft) return;
          
          const contact = await db.query.contacts.findFirst({
            where: eq(contacts.id, draft.contactId)
          });
          
          if (contact?.email) {
            await emailService.sendEmail({
              to: contact.email,
              subject: draft.subject,
              body: draft.body,
              campaignId: campaign.id,
              draftId: draft.id,
            });
            
            // Update draft status
            await db.update(emailDrafts)
              .set({ status: 'sent', sentAt: new Date() })
              .where(eq(emailDrafts.id, draft.id));
          }
        });
        
        await Promise.all(sendPromises);
        
        // Update campaign status
        await db.update(emailCampaigns)
          .set({ status: 'sent', completedAt: new Date() })
          .where(eq(emailCampaigns.id, campaign.id));
      } catch (error) {
        console.error('Error sending emails:', error);
        // Update campaign status to failed
        await db.update(emailCampaigns)
          .set({ status: 'failed' })
          .where(eq(emailCampaigns.id, campaign.id));
      }
    }
    
    res.json({ id: campaign.id, success: true });
  } catch (error) {
    console.error('Error creating quick campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update draft status
router.put('/drafts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'approved', 'rejected', 'sent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'sent') {
      updateData.sentAt = new Date();
    }

    const [updatedDraft] = await getDb()
      .update(emailDrafts)
      .set(updateData)
      .where(eq(emailDrafts.id, id))
      .returning();

    if (!updatedDraft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json(updatedDraft);
  } catch (error) {
    console.error('Error updating draft status:', error);
    res.status(500).json({ error: 'Failed to update draft status' });
  }
});

// Update draft content
router.put('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, changeDescription } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    // Get the current draft first
    const currentDraft = await getDb().query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
    });

    if (!currentDraft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Get the latest version number
    const latestVersion = await getDb().query.emailDraftVersions.findFirst({
      where: eq(emailDraftVersions.draftId, id),
      orderBy: [desc(emailDraftVersions.versionNumber)],
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Save the current version before updating
    await getDb().insert(emailDraftVersions).values({
      draftId: id,
      versionNumber: nextVersionNumber,
      subject: currentDraft.subject,
      body: currentDraft.body,
      variables: [], // TODO: Extract variables from the draft
      editedBy: 'user',
      changeDescription: changeDescription || 'Manual edit',
    });

    // Update the draft
    const [updatedDraft] = await getDb()
      .update(emailDrafts)
      .set({ 
        subject, 
        body,
        // Reset approval status when content is edited
        status: 'draft',
        approvedAt: null
      })
      .where(eq(emailDrafts.id, id))
      .returning();

    res.json(updatedDraft);
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

// Get draft version history
router.get('/drafts/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;

    const versions = await getDb().query.emailDraftVersions.findMany({
      where: eq(emailDraftVersions.draftId, id),
      orderBy: [desc(emailDraftVersions.versionNumber)],
    });

    res.json({ versions });
  } catch (error) {
    console.error('Error fetching draft versions:', error);
    res.status(500).json({ error: 'Failed to fetch draft versions' });
  }
});

// Export campaign drafts as CSV for Gmail Mail Merge
router.get('/campaigns/:id/export-csv', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get campaign details
    const campaign = await getDb().query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all approved drafts for this campaign with contact details
    const draftsWithContacts = await getDb()
      .select({
        draft: emailDrafts,
        contact: contacts,
      })
      .from(emailDrafts)
      .innerJoin(contacts, eq(contacts.id, emailDrafts.contactId))
      .where(
        and(
          eq(emailDrafts.campaignId, id),
          eq(emailDrafts.status, 'approved')
        )
      );

    if (draftsWithContacts.length === 0) {
      return res.status(400).json({ error: 'No approved drafts found for this campaign' });
    }

    // Create CSV content
    const csvRows = [];
    
    // Header row - Gmail Mail Merge format
    csvRows.push([
      'Email',
      'First Name',
      'Last Name',
      'Company',
      'Position',
      'Subject',
      'Body',
      'Phone',
      'Website',
      'Notes'
    ].join(','));

    // Data rows
    for (const { draft, contact } of draftsWithContacts) {
      const row = [
        contact.email || '',
        contact.firstName || '',
        contact.lastName || '',
        contact.company || '',
        contact.title || '',
        draft.subject,
        draft.body.replace(/"/g, '""'), // Escape quotes in body
        contact.phone || '',
        contact.website || '',
        contact.notes || ''
      ].map(field => `"${field}"`).join(',');
      
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');
    
    // Set headers for file download
    const filename = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_mail_merge_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting campaign CSV:', error);
    res.status(500).json({ error: 'Failed to export campaign CSV' });
  }
});

// Send a single email draft
router.post('/drafts/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify draft exists
    const draft = await getDb().query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
    });
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    if (draft.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved drafts can be sent' });
    }
    
    // Check if email service is available
    try {
      const sender = getEmailSender();
      const isConnected = await sender.testConnection();
      if (!isConnected) {
        return res.status(503).json({ error: 'Email service is not configured properly. Please check SMTP settings.' });
      }
    } catch (error) {
      return res.status(503).json({ error: 'Email service is not available. Please configure SMTP settings.' });
    }
    
    // Send the email
    const result = await getEmailSender().sendDraft(id);
    
    if (result.success) {
      res.json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending draft:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send all approved drafts for a campaign
router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { draftIds } = req.body; // Optional: specific draft IDs to send
    
    // Verify campaign exists
    const campaign = await getDb().query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if email service is available
    try {
      const sender = getEmailSender();
      const isConnected = await sender.testConnection();
      if (!isConnected) {
        return res.status(503).json({ error: 'Email service is not configured properly. Please check SMTP settings.' });
      }
    } catch (error) {
      return res.status(503).json({ error: 'Email service is not available. Please configure SMTP settings.' });
    }
    
    // Send emails
    const results = await getEmailSender().sendCampaignDrafts(id, draftIds);
    
    res.json({
      message: 'Email sending completed',
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending campaign emails:', error);
    res.status(500).json({ error: 'Failed to send campaign emails' });
  }
});

// Test email configuration
router.get('/test-email-config', async (req, res) => {
  try {
    const sender = getEmailSender();
    const isConnected = await sender.testConnection();
    
    if (isConnected) {
      res.json({ 
        connected: true, 
        message: 'Email service is configured correctly',
        smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtp_user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}...` : 'Not configured'
      });
    } else {
      res.status(503).json({ 
        connected: false, 
        message: 'Email service connection failed' 
      });
    }
  } catch (error) {
    res.status(503).json({ 
      connected: false, 
      message: 'Email service is not configured. Please set SMTP environment variables.' 
    });
  }
});

export default router;