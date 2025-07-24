import { pgTable, uuid, text, timestamp, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';
import { events } from './events';

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  title: text('title'),
  industry: text('industry'),
  address: text('address'),
  website: text('website'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  ocrConfidence: decimal('ocr_confidence', { precision: 3, scale: 2 }),
  needsReview: boolean('needs_review').default(false).notNull(),
  rawOcrData: text('raw_ocr_data'),
  fieldConfidenceScores: jsonb('field_confidence_scores').$type<{
    firstName?: number;
    lastName?: number;
    email?: number;
    phone?: number;
    company?: number;
    title?: number;
    industry?: number;
    address?: number;
    website?: number;
    notes?: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;