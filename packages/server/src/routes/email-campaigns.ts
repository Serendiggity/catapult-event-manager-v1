import { Router } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { emailCampaigns, campaignGroups, emailDrafts, leadGroups, contactsToLeadGroups, contacts } from '../db/schema';
import type { EmailCampaign, NewEmailCampaign, CampaignGroup, NewCampaignGroup } from '../db/schema';
import { EmailGenerator } from '../services/email-generation/email-generator';

const router = Router();
let emailGenerator: EmailGenerator | null = null;

// Lazy initialization of email generator
function getEmailGenerator(): EmailGenerator {
  if (!emailGenerator) {
    emailGenerator = new EmailGenerator();
  }
  return emailGenerator;
}

// Get all email campaigns for an event
router.get('/events/:eventId/campaigns', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const campaigns = await getDb().query.emailCampaigns.findMany({
      where: eq(emailCampaigns.eventId, eventId),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    // Get lead groups for each campaign
    const campaignsWithGroups = await Promise.all(
      campaigns.map(async (campaign) => {
        const groups = await getDb()
          .select({
            leadGroup: leadGroups,
          })
          .from(campaignGroups)
          .innerJoin(leadGroups, eq(leadGroups.id, campaignGroups.leadGroupId))
          .where(eq(campaignGroups.campaignId, campaign.id));

        return {
          ...campaign,
          leadGroups: groups.map(g => g.leadGroup),
        };
      })
    );

    res.json(campaignsWithGroups);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
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

    // Get lead groups for the campaign
    const groups = await getDb()
      .select({
        leadGroup: leadGroups,
      })
      .from(campaignGroups)
      .innerJoin(leadGroups, eq(leadGroups.id, campaignGroups.leadGroupId))
      .where(eq(campaignGroups.campaignId, campaign.id));

    res.json({
      ...campaign,
      leadGroups: groups.map(g => g.leadGroup),
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create a new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { eventId, name, subject, templateBody, variables, leadGroupIds } = req.body;

    // Create the campaign
    const [campaign] = await getDb().insert(emailCampaigns).values({
      eventId,
      name,
      subject,
      templateBody,
      variables: variables || [],
    }).returning();

    // Associate lead groups
    if (leadGroupIds && leadGroupIds.length > 0) {
      await getDb().insert(campaignGroups).values(
        leadGroupIds.map((leadGroupId: string) => ({
          campaignId: campaign.id,
          leadGroupId,
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
    const { name, subject, templateBody, variables, leadGroupIds } = req.body;

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

    // Update lead group associations if provided
    if (leadGroupIds !== undefined) {
      // Remove existing associations
      await getDb().delete(campaignGroups).where(eq(campaignGroups.campaignId, id));

      // Add new associations
      if (leadGroupIds.length > 0) {
        await getDb().insert(campaignGroups).values(
          leadGroupIds.map((leadGroupId: string) => ({
            campaignId: id,
            leadGroupId,
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

export default router;