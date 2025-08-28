import OpenAI from 'openai';
import { getDb } from '../../db/connection';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  emailCampaigns, 
  campaignGroupAssignments, 
  emailDrafts, 
  campaignGroups, 
  contactsToCampaignGroups,
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
      const [campaign] = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, campaignId))
        .limit(1);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status to generating
      await db
        .update(emailCampaigns)
        .set({ status: 'generating', updatedAt: new Date() })
        .where(eq(emailCampaigns.id, campaignId));

      // Get event details
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, campaign.eventId))
        .limit(1);

      // Get all campaign groups for this campaign
      const groups = await db
        .select({ campaignGroupId: campaignGroupAssignments.campaignGroupId })
        .from(campaignGroupAssignments)
        .where(eq(campaignGroupAssignments.campaignId, campaignId));

      const campaignGroupIds = groups.map(g => g.campaignGroupId);

      // Get all contacts in these campaign groups
      const contactsInGroups = await db
        .select({
          contact: contacts,
        })
        .from(contactsToCampaignGroups)
        .innerJoin(contacts, eq(contacts.id, contactsToCampaignGroups.contactId))
        .where(inArray(contactsToCampaignGroups.campaignGroupId, campaignGroupIds));

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
    const allVariables: Record<string, string> = {
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

    // Add sender variables if they exist
    const senderVars = campaign.senderVariables || {};
    const allVarsWithSender = { ...allVariables, ...senderVars };

    let personalizedSubject = campaign.subject;
    let personalizedBody = campaign.templateBody;

    // Get enabled variables - use all variables if enabledVariables is not set (backward compatibility)
    const enabledVariables = campaign.enabledVariables && campaign.enabledVariables.length > 0 
      ? campaign.enabledVariables 
      : Object.keys(allVariables);

    // Replace enabled lead variables and all sender variables in subject and body
    for (const varName of enabledVariables) {
      const value = allVariables[varName] || '';
      const placeholder = `{{${varName}}}`;
      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
      personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // Replace sender variables
    for (const [varName, value] of Object.entries(senderVars)) {
      const placeholder = `{{${varName}}}`;
      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
      personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Use AI to enhance the email
    const contextInfo = [];
    if (enabledVariables.includes('firstName') && contact.firstName) {
      contextInfo.push(`first name: ${contact.firstName}`);
    }
    if (enabledVariables.includes('lastName') && contact.lastName) {
      contextInfo.push(`last name: ${contact.lastName}`);
    }
    if (enabledVariables.includes('position') && contact.title) {
      contextInfo.push(`position: ${contact.title}`);
    }
    if (enabledVariables.includes('company') && contact.company) {
      contextInfo.push(`company: ${contact.company}`);
    }

    const prompt = `You are an expert email writer. Enhance the following email draft to make it more personal, engaging, and professional. 
    
${contextInfo.length > 0 ? `The email recipient has the following information: ${contextInfo.join(', ')}.` : 'Limited recipient information is available.'}

IMPORTANT: All variables ({{variableName}}) represent information about the EMAIL RECIPIENT, not the sender. For example:
- {{firstName}} is the recipient's first name
- {{company}} is the recipient's company
- {{position}} is the recipient's job title

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
            content: 'You are an expert email writer who creates personalized, professional emails. Remember that all template variables refer to the email recipient\'s information, not the sender\'s.',
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
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, campaign.eventId))
      .limit(1);

    // Get contact details
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.generateDraftForContact(campaign, contact, event);
  }

  async refineTemplate(
    prompt: string,
    currentTemplate: { subject: string; body: string },
    enabledVariables: string[],
    context?: Array<{ role: string; content: string }>,
    enabledSenderVariables?: Record<string, string>
  ): Promise<{ subject: string; body: string; explanation: string }> {
    try {
      const senderVarsList = enabledSenderVariables 
        ? Object.keys(enabledSenderVariables).map(key => `- {{${key}}} (sender's ${key.replace('sender', '').toLowerCase()})`)
        : [];

      const systemPrompt = `You are an expert email copywriter helping to create effective email campaigns. 
You should maintain personalization variables in the format {{variableName}}.

Available variables for email recipient personalization:
${enabledVariables.map(v => `- {{${v}}} (recipient's ${v})`).join('\n')}

${senderVarsList.length > 0 ? `Available variables for sender personalization:
${senderVarsList.join('\n')}` : ''}

IMPORTANT: Variable types:
- Lead/Recipient variables ({{firstName}}, {{company}}, etc.) = Information about the EMAIL RECIPIENT
- Sender variables ({{senderName}}, {{senderCompany}}, etc.) = Information about the EMAIL SENDER

When the user asks to include sender information (like signature, contact details, etc.), use the sender variables appropriately.
When personalizing for the recipient, use the lead variables.

Important:
1. Keep all {{variable}} placeholders intact
2. Only use the enabled variables listed above
3. Make the email natural and engaging
4. Keep it professional unless instructed otherwise
5. Ensure the message flows well with the variables
6. Intelligently place sender variables in appropriate contexts (e.g., signature, introduction)
7. REQUIRED: Return response as valid JSON with these exact fields:
   - "subject": The refined email subject line (string)
   - "body": The refined email body content (string)
   - "explanation": A brief explanation of changes made (string)
   
Example response format:
{
  "subject": "Great meeting you at {{eventName}}!",
  "body": "Hi {{firstName}},\\n\\nIt was wonderful meeting you...",
  "explanation": "I've made the email more personable and added a clear call-to-action."
}`;

      const userPrompt = `Current email template:
Subject: ${currentTemplate.subject}
Body: ${currentTemplate.body}

User request: ${prompt}

Please refine this email template based on the user's request. Maintain all variable placeholders and ensure the email will work well when personalized.

Remember to return a valid JSON object with "subject", "body", and "explanation" fields.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt }
      ];

      // Add context if provided
      if (context && context.length > 0) {
        context.forEach(msg => {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        });
      }

      messages.push({ role: 'user', content: userPrompt });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(result) as { 
        subject: string; 
        body: string; 
        explanation: string 
      };

      // Validate the response has all required fields
      if (!parsed.subject || !parsed.body) {
        console.error('AI response missing required fields:', parsed);
        throw new Error('Invalid AI response structure');
      }

      return parsed;
    } catch (error) {
      console.error('Error refining template:', error);
      
      // Return the current template unchanged with an explanation
      // This ensures the UI continues to work even if AI fails
      return {
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        explanation: 'I encountered an issue processing your request. Please try rephrasing your prompt or check that the OpenAI API is configured correctly.'
      };
    }
  }
}