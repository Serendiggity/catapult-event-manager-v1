import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { emailDrafts } from './email-campaigns';

export const emailDraftVersions = pgTable('email_draft_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').notNull().references(() => emailDrafts.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  variables: jsonb('variables').notNull().default([]),
  editedBy: text('edited_by'), // Could be 'user' or 'ai'
  changeDescription: text('change_description'), // Summary of what changed
  createdAt: timestamp('created_at').notNull().defaultNow(),
});