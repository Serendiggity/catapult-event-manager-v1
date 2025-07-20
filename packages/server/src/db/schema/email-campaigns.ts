import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { leadGroups } from './lead-groups';
import { events } from './events';

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  templateBody: text('template_body').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]).notNull(), // List of variable names used in template
  status: text('status', { enum: ['draft', 'generating', 'ready', 'sent'] }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for many-to-many relationship between campaigns and lead groups
export const campaignGroups = pgTable('campaign_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => emailCampaigns.id, { onDelete: 'cascade' }).notNull(),
  leadGroupId: uuid('lead_group_id').references(() => leadGroups.id, { onDelete: 'cascade' }).notNull(),
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

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert;
export type CampaignGroup = typeof campaignGroups.$inferSelect;
export type NewCampaignGroup = typeof campaignGroups.$inferInsert;
export type EmailDraft = typeof emailDrafts.$inferSelect;
export type NewEmailDraft = typeof emailDrafts.$inferInsert;