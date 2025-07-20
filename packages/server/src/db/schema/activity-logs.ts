import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'), // Will be used when auth is implemented
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(), // 'event', 'contact', 'lead_group', 'campaign', etc.
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;