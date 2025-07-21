// Special event IDs and configuration
// This UUID must match the one in the server migration
export const QUICK_ADD_EVENT_ID = '00000000-0000-4000-8000-000000000001';

export const QUICK_ADD_EVENT = {
  id: QUICK_ADD_EVENT_ID,
  title: 'Quick Add Leads',
  description: 'For leads collected outside of formal events',
  icon: '⚡', // Lightning bolt for quick actions
  color: 'purple' // Special color to distinguish
} as const;