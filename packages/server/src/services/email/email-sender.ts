import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getDb } from '../../db/connection';
import { eq, and, inArray } from 'drizzle-orm';
import { emailDrafts, contacts, emailCampaigns } from '../../db/schema';
import type { EmailDraft, Contact, EmailCampaign } from '../../db/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailSender {
  private transporter: Transporter;
  
  constructor() {
    // Initialize with environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (!config.auth.user || !config.auth.pass) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendDraft(draftId: string): Promise<SendEmailResult> {
    try {
      const db = getDb();
      
      // Get draft with contact info
      const [draft] = await db
        .select()
        .from(emailDrafts)
        .where(eq(emailDrafts.id, draftId))
        .limit(1);

      if (!draft) {
        return { success: false, error: 'Draft not found' };
      }

      // Get contact details
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, draft.contactId))
        .limit(1);

      if (!contact || !contact.email) {
        return { success: false, error: 'Contact not found or has no email' };
      }

      // Get campaign for sender info
      const [campaign] = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, draft.campaignId))
        .limit(1);

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Catapult Event Manager'}" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: draft.subject,
        text: draft.body,
        html: this.convertToHtml(draft.body),
      });

      // Update draft status
      await db
        .update(emailDrafts)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(emailDrafts.id, draftId));

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async sendCampaignDrafts(campaignId: string, draftIds?: string[]): Promise<{
    sent: number;
    failed: number;
    errors: { draftId: string; error: string }[];
  }> {
    const db = getDb();
    let draftsToSend;

    if (draftIds && draftIds.length > 0) {
      // Send specific drafts
      draftsToSend = await db
        .select()
        .from(emailDrafts)
        .where(and(
          eq(emailDrafts.campaignId, campaignId),
          eq(emailDrafts.status, 'approved'),
          inArray(emailDrafts.id, draftIds)
        ));
    } else {
      // Send all approved drafts
      draftsToSend = await db
        .select()
        .from(emailDrafts)
        .where(and(
          eq(emailDrafts.campaignId, campaignId),
          eq(emailDrafts.status, 'approved')
        ));
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { draftId: string; error: string }[],
    };

    // Send emails with rate limiting
    for (const draft of draftsToSend) {
      const result = await this.sendDraft(draft.id);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          draftId: draft.id,
          error: result.error || 'Unknown error',
        });
      }

      // Rate limiting: wait 1 second between emails to avoid hitting limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update campaign status if all approved drafts have been sent
    const remainingDrafts = await db
      .select()
      .from(emailDrafts)
      .where(and(
        eq(emailDrafts.campaignId, campaignId),
        eq(emailDrafts.status, 'approved')
      ));

    if (remainingDrafts.length === 0) {
      await db
        .update(emailCampaigns)
        .set({ 
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, campaignId));
    }

    return results;
  }

  private convertToHtml(text: string): string {
    // Simple text to HTML conversion
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}