import { getDb } from '../connection';
import { events } from '../schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Use a deterministic UUID for the quick add event so it's consistent
// This is a v5 namespace UUID generated from the string "quick-add-leads-default"
export const QUICK_ADD_EVENT_ID = '00000000-0000-4000-8000-000000000001';

export async function createQuickAddEvent() {
  const db = getDb();
  
  try {
    // Check if the quick add event already exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, QUICK_ADD_EVENT_ID)
    });

    if (!existingEvent) {
      // Create the quick add event
      await db.insert(events).values({
        id: QUICK_ADD_EVENT_ID,
        title: 'Quick Add Leads',
        description: 'For leads collected outside of formal events',
        location: 'Various',
        date: new Date('2025-01-01T00:00:00Z'), // Set to beginning of year
        capacity: 9999, // Essentially unlimited
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created Quick Add Leads default event');
    } else {
      console.log('ℹ️ Quick Add Leads event already exists');
    }
  } catch (error) {
    console.error('Error creating Quick Add event:', error);
    // Don't fail server startup if this migration fails
  }
}