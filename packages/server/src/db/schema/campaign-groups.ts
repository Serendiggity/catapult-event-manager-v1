import { pgTable, uuid, text, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { events } from './events';

export const campaignGroups = pgTable('campaign_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // Default blue color
  contactCount: integer('contact_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for many-to-many relationship between contacts and campaign groups
export const contactsToCampaignGroups = pgTable('contacts_to_campaign_groups', 
  {
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
    campaignGroupId: uuid('campaign_group_id').references(() => campaignGroups.id, { onDelete: 'cascade' }).notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contactId, table.campaignGroupId] })
  })
);

// Import contacts after defining campaignGroups to avoid circular dependency
import { contacts } from './contacts';

export type CampaignGroup = typeof campaignGroups.$inferSelect;
export type NewCampaignGroup = typeof campaignGroups.$inferInsert;