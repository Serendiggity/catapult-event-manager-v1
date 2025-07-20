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

export interface CampaignGroup {
  id: string;
  campaignId: string;
  leadGroupId: string;
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

export interface Contact {
  id: string;
  eventId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  notes: string | null;
  tags: string[] | null;
  source: 'manual' | 'ocr' | 'csv' | 'api';
  ocrData: any | null;
  needsReview: boolean;
  overallConfidence: number | null;
  fieldConfidenceScores: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadGroup {
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