import { pgTable, uuid, text, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';
import { events } from './events';

export const leadGroups = pgTable('lead_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // Default blue color
  contactCount: integer('contact_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for many-to-many relationship between contacts and lead groups
export const contactsToLeadGroups = pgTable('contacts_to_lead_groups', 
  {
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
    leadGroupId: uuid('lead_group_id').references(() => leadGroups.id, { onDelete: 'cascade' }).notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contactId, table.leadGroupId] })
  })
);

// Import contacts after defining leadGroups to avoid circular dependency
import { contacts } from './contacts';

export type LeadGroup = typeof leadGroups.$inferSelect;
export type NewLeadGroup = typeof leadGroups.$inferInsert;