import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { campaignGroups } from './campaign-groups';
import { events } from './events';

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  templateBody: text('template_body').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]).notNull(), // List of variable names used in template
  enabledVariables: jsonb('enabled_variables').$type<string[]>().default([]).notNull(), // Variables that AI should use for personalization
  senderVariables: jsonb('sender_variables').$type<Record<string, string>>().default({}).notNull(), // Sender information variables
  aiChatHistory: jsonb('ai_chat_history').$type<Array<{role: string; content: string; timestamp: string}>>().default([]), // Chat history with AI
  status: text('status', { enum: ['draft', 'generating', 'ready', 'sending', 'sent', 'failed'] }).default('draft').notNull(),
  recipientCount: integer('recipient_count').default(0).notNull(),
  aiProvider: text('ai_provider').default('none'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Junction table for many-to-many relationship between campaigns and campaign groups
export const campaignGroupAssignments = pgTable('campaign_group_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => emailCampaigns.id, { onDelete: 'cascade' }).notNull(),
  campaignGroupId: uuid('campaign_group_id').references(() => campaignGroups.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table to store generated email drafts for each contact
export const emailDrafts = pgTable('email_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => emailCampaigns.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: ['draft', 'approved', 'rejected', 'sent'] }).default('draft').notNull(),
  aiModel: text('ai_model').default('gpt-4o-mini'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  sentAt: timestamp('sent_at'),
});

// Import contacts after defining emailCampaigns to avoid circular dependency
import { contacts } from './contacts';

// Import draft versions table
export { emailDraftVersions } from './email-draft-versions';

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert;
export type CampaignGroupAssignment = typeof campaignGroupAssignments.$inferSelect;
export type NewCampaignGroupAssignment = typeof campaignGroupAssignments.$inferInsert;
export type EmailDraft = typeof emailDrafts.$inferSelect;
export type NewEmailDraft = typeof emailDrafts.$inferInsert;