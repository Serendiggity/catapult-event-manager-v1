export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  attendees: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailCampaign {
  id: string;
  eventId: string;
  name: string;
  subject: string;
  templateBody: string;
  variables: string[];
  status: 'draft' | 'generating' | 'ready' | 'sent';
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignGroupAssignment {
  id: string;
  campaignId: string;
  campaignGroupId: string;
  createdAt: Date;
}

export interface EmailDraft {
  id: string;
  campaignId: string;
  contactId: string;
  subject: string;
  body: string;
  status: 'draft' | 'approved' | 'rejected' | 'sent';
  aiModel: string;
  generatedAt: Date;
  approvedAt: Date | null;
  sentAt: Date | null;
}

/**
 * IMPORTANT TERMINOLOGY NOTE:
 * 
 * Throughout the codebase, we use "Contact" in the database, API, and internal code,
 * but display "Lead" in the UI. This is intentional:
 * 
 * - Database: Uses 'contacts' table for stability and compatibility
 * - API: Uses /api/contacts endpoints to maintain consistency
 * - Code: Uses Contact interfaces and contact variables
 * - UI: Displays "Leads" to users as it better represents the business context
 * 
 * When working on this codebase:
 * - Keep using "contact" in code and database
 * - Use "lead" only in user-facing text (UI labels, messages, etc.)
 * - This separation allows us to change business terminology without breaking changes
 */
export interface Contact {
  id: string;
  eventId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  source: 'manual' | 'ocr' | 'csv' | 'api';
  ocrData: any | null;
  ocrConfidence: number | null;
  needsReview: boolean;
  overallConfidence: number | null;
  fieldConfidenceScores: {
    firstName?: number;
    lastName?: number;
    email?: number;
    phone?: number;
    company?: number;
    title?: number;
    address?: number;
    website?: number;
    notes?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignGroup {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}