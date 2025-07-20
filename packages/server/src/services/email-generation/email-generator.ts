import OpenAI from 'openai';
import { getDb } from '../../db/connection';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  emailCampaigns, 
  campaignGroups, 
  emailDrafts, 
  leadGroups, 
  contactsToLeadGroups,
  contacts,
  events 
} from '../../db/schema';
import type { EmailCampaign, Contact, Event } from '../../db/schema';

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  status: string;
}

export class EmailGenerator {
  private openai: OpenAI;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.openai = new OpenAI({ apiKey });
  }

  async generateDraftsForCampaign(
    campaignId: string, 
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<void> {
    try {
      const db = getDb();
      
      // Get campaign details
      const campaign = await db.query.emailCampaigns.findFirst({
        where: eq(emailCampaigns.id, campaignId),
      });
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status to generating
      await db
        .update(emailCampaigns)
        .set({ status: 'generating', updatedAt: new Date() })
        .where(eq(emailCampaigns.id, campaignId));

      // Get event details
      const event = await db.query.events.findFirst({
        where: eq(events.id, campaign.eventId),
      });

      // Get all lead groups for this campaign
      const groups = await db
        .select({ leadGroupId: campaignGroups.leadGroupId })
        .from(campaignGroups)
        .where(eq(campaignGroups.campaignId, campaignId));

      const leadGroupIds = groups.map(g => g.leadGroupId);

      // Get all contacts in these lead groups
      const contactsInGroups = await db
        .select({
          contact: contacts,
        })
        .from(contactsToLeadGroups)
        .innerJoin(contacts, eq(contacts.id, contactsToLeadGroups.contactId))
        .where(inArray(contactsToLeadGroups.leadGroupId, leadGroupIds));

      const uniqueContacts = Array.from(
        new Map(contactsInGroups.map(c => [c.contact.id, c.contact])).values()
      );

      const progress: GenerationProgress = {
        total: uniqueContacts.length,
        completed: 0,
        failed: 0,
        status: 'generating',
      };

      // Generate drafts for each contact
      for (const contact of uniqueContacts) {
        try {
          const draft = await this.generateDraftForContact(
            campaign,
            contact,
            event
          );

          // Save draft to database
          await db.insert(emailDrafts).values({
            campaignId: campaign.id,
            contactId: contact.id,
            subject: draft.subject,
            body: draft.body,
            status: 'draft',
            aiModel: 'gpt-4o-mini',
          });

          progress.completed++;
        } catch (error) {
          console.error(`Failed to generate draft for contact ${contact.id}:`, error);
          progress.failed++;
        }

        if (onProgress) {
          onProgress(progress);
        }
      }

      // Update campaign status
      await db
        .update(emailCampaigns)
        .set({ 
          status: progress.failed === 0 ? 'ready' : 'draft',
          updatedAt: new Date() 
        })
        .where(eq(emailCampaigns.id, campaignId));

    } catch (error) {
      console.error('Error generating drafts:', error);
      
      // Update campaign status to draft on error
      await getDb()
        .update(emailCampaigns)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(emailCampaigns.id, campaignId));
      
      throw error;
    }
  }

  private async generateDraftForContact(
    campaign: EmailCampaign,
    contact: Contact,
    event: Event | undefined
  ): Promise<{ subject: string; body: string }> {
    // Replace variables in template
    const variables: Record<string, string> = {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      company: contact.company || '',
      position: contact.title || '',
      phone: contact.phone || '',
      website: contact.website || '',
      notes: contact.notes || '',
      eventName: event?.title || '',
      eventDate: event?.date ? new Date(event.date).toLocaleDateString() : '',
    };

    let personalizedSubject = campaign.subject;
    let personalizedBody = campaign.templateBody;

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
      personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Use AI to enhance the email
    const prompt = `You are an expert email writer. Enhance the following email draft to make it more personal, engaging, and professional. 
    
The email is being sent to ${contact.firstName || 'a contact'} ${contact.lastName || ''} ${contact.title ? `who works as ${contact.title}` : ''} ${contact.company ? `at ${contact.company}` : ''}.

Original Subject: ${personalizedSubject}
Original Body: ${personalizedBody}

Important instructions:
1. Keep the same general message and intent
2. Make it sound natural and conversational
3. Ensure it's professional but friendly
4. Keep it concise (under 200 words)
5. Fix any grammar or awkward phrasing
6. If any placeholders remain unfilled (like {{variable}}), remove them gracefully
7. Return the response in JSON format with "subject" and "body" fields

Return only the JSON with no additional text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email writer who creates personalized, professional emails.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(result) as { subject: string; body: string };
      return parsed;
    } catch (error) {
      console.error('Error generating enhanced email:', error);
      // Fallback to original if AI fails
      return {
        subject: personalizedSubject,
        body: personalizedBody,
      };
    }
  }

  async generateSingleDraft(
    campaignId: string,
    contactId: string
  ): Promise<{ subject: string; body: string }> {
    const db = getDb();
    
    // Get campaign details
    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, campaignId),
    });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, campaign.eventId),
    });

    // Get contact details
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.generateDraftForContact(campaign, contact, event);
  }
}