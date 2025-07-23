import { Request, Response } from 'express';
import { getDb } from '../db/connection';
import { contacts, NewContact } from '../db/schema/contacts';
import { OCRService } from '../services/ocr/ocr-service';
import { eq, and } from 'drizzle-orm';

interface CreateContactFromOCRRequest {
  eventId: string;
  ocrText: string;
  imageUrl?: string;
}

// Create OCR service instance lazily to ensure env vars are loaded
let ocrService: OCRService | null = null;

function getOCRService(): OCRService {
  if (!ocrService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    ocrService = new OCRService(apiKey);
  }
  return ocrService;
}

export async function createContactFromOCR(
  req: Request<{}, {}, CreateContactFromOCRRequest>,
  res: Response
) {
  try {
    const { eventId, ocrText, imageUrl } = req.body;

    // Validate input
    if (!eventId || !ocrText) {
      return res.status(400).json({
        error: 'Missing required fields: eventId and ocrText'
      });
    }

    // Parse the OCR text using AI
    const parsedData = await getOCRService().parseBusinessCardText(ocrText);
    
    // Convert to database format
    const dbData = getOCRService().toDatabaseFormat(parsedData.parsedData);
    
    // Create the contact record
    const newContact: NewContact = {
      eventId,
      firstName: dbData.firstName,
      lastName: dbData.lastName,
      email: dbData.email,
      phone: dbData.phone,
      company: dbData.company,
      title: dbData.title,
      address: parsedData.parsedData.address?.value || null,
      imageUrl: imageUrl || null,
      ocrConfidence: parsedData.overallConfidence.toString(),
      needsReview: dbData.needsReview,
      rawOcrData: parsedData.rawText,
      fieldConfidenceScores: dbData.confidenceScores
    };

    const [insertedContact] = await getDb().insert(contacts).values(newContact).returning();

    res.json({
      success: true,
      contact: insertedContact,
      parsedData: parsedData.parsedData,
      overallConfidence: parsedData.overallConfidence
    });
  } catch (error) {
    console.error('Error creating contact from OCR:', error);
    res.status(500).json({
      error: 'Failed to create contact from OCR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getContactsNeedingReview(req: Request, res: Response) {
  try {
    const { eventId } = req.query;
    
    let query;
    if (eventId) {
      query = getDb().select().from(contacts)
        .where(and(
          eq(contacts.needsReview, true),
          eq(contacts.eventId, eventId as string)
        ))
        .orderBy(contacts.createdAt);
    } else {
      query = getDb().select().from(contacts)
        .where(eq(contacts.needsReview, true))
        .orderBy(contacts.createdAt);
    }
    
    const contactsNeedingReview = await query;
    
    res.json({
      success: true,
      contacts: contactsNeedingReview,
      count: contactsNeedingReview.length
    });
  } catch (error) {
    console.error('Error fetching contacts needing review:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts needing review'
    });
  }
}

export async function updateContactAfterReview(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.rawOcrData;
    
    // If all required fields are now filled with high confidence, remove needsReview flag
    if (updates.firstName && updates.lastName && updates.email) {
      updates.needsReview = false;
    }
    
    // Update the contact
    const [updatedContact] = await getDb().update(contacts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id))
      .returning();
    
    if (!updatedContact) {
      return res.status(404).json({
        error: 'Contact not found'
      });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      error: 'Failed to update contact'
    });
  }
}

export async function getContactsByEvent(
  req: Request<{ eventId: string }>,
  res: Response
) {
  try {
    const { eventId } = req.params;
    
    const eventContacts = await getDb().select().from(contacts)
      .where(eq(contacts.eventId, eventId))
      .orderBy(contacts.createdAt);
    
    res.json({
      success: true,
      contacts: eventContacts,
      count: eventContacts.length,
      needsReview: eventContacts.filter(c => c.needsReview).length
    });
  } catch (error) {
    console.error('Error fetching contacts by event:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts'
    });
  }
}

export async function getAllContacts(req: Request, res: Response) {
  try {
    const { 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Get contacts with events
    const { events } = await import('../db/schema');
    let allContacts = await getDb().select().from(contacts);
    const allEvents = await getDb().select().from(events);
    
    // Debug logging only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] Fetching contacts: ${allContacts.length} contacts, ${allEvents.length} events`);
    }
    
    // Create event map
    const eventMap = new Map(allEvents.map(e => [e.id, e]));
    
    // Add event data to contacts
    const contactsWithEvents = allContacts.map(contact => {
      const event = eventMap.get(contact.eventId);
      return {
        ...contact,
        event: event || null
      };
    });
    
    // Apply search filter in memory
    let filteredContacts = contactsWithEvents;
    if (search) {
      const searchLower = String(search).toLowerCase();
      
      // Define common title synonyms for natural language search
      const titleSynonyms: Record<string, string[]> = {
        'realtor': ['real estate agent', 'real estate broker', 'real estate professional', 'property agent', 'estate agent', 'commercial property sales', 'residential sales agent', 'real estate salesperson'],
        'real estate': ['realtor', 'property', 'estate agent', 'real estate broker', 'real estate agent'],
        'developer': ['software developer', 'engineer', 'programmer', 'coder', 'software engineer', 'dev', 'full stack', 'fullstack', 'backend', 'frontend'],
        'engineer': ['developer', 'software engineer', 'programmer', 'technical lead', 'tech lead', 'engineering'],
        'sales': ['sales rep', 'sales representative', 'account executive', 'business development', 'bd', 'sales manager', 'sales director', 'vp sales'],
        'marketing': ['marketer', 'marketing manager', 'marketing director', 'cmo', 'brand manager', 'digital marketing', 'marketing specialist'],
        'ceo': ['chief executive', 'chief executive officer', 'founder', 'co-founder', 'president', 'owner'],
        'cto': ['chief technology officer', 'vp engineering', 'technical director', 'head of engineering'],
        'designer': ['ux designer', 'ui designer', 'product designer', 'graphic designer', 'visual designer', 'design'],
        'manager': ['mgr', 'team lead', 'lead', 'supervisor', 'head of'],
        'doctor': ['dr', 'physician', 'md', 'medical doctor', 'surgeon'],
        'lawyer': ['attorney', 'counsel', 'legal counsel', 'solicitor', 'barrister', 'advocate'],
        'consultant': ['advisor', 'consulting', 'freelance', 'contractor', 'independent'],
        'accountant': ['cpa', 'accounting', 'finance', 'financial advisor', 'bookkeeper'],
        'teacher': ['educator', 'professor', 'instructor', 'lecturer', 'faculty'],
      };
      
      // Function to check if search term matches title with synonyms
      const matchesTitle = (title: string | null, searchTerm: string): boolean => {
        if (!title) return false;
        const titleLower = title.toLowerCase();
        
        // Direct match
        if (titleLower.includes(searchTerm)) return true;
        
        // Check synonyms
        for (const [key, synonyms] of Object.entries(titleSynonyms)) {
          if (searchTerm.includes(key) || key.includes(searchTerm)) {
            // If search term matches a key, check if title contains any synonym
            if (synonyms.some(syn => titleLower.includes(syn))) return true;
          }
          // Also check if search term is in synonyms and title contains the key
          if (synonyms.some(syn => syn.includes(searchTerm))) {
            if (titleLower.includes(key)) return true;
            // Or if title contains any other synonym in the same group
            if (synonyms.some(syn => titleLower.includes(syn))) return true;
          }
        }
        
        return false;
      };
      
      filteredContacts = contactsWithEvents.filter(contact => 
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        matchesTitle(contact.title, searchLower)
      );
    }
    
    // Apply status filter
    if (status === 'needs-review') {
      filteredContacts = filteredContacts.filter(c => c.needsReview === true);
    } else if (status === 'verified') {
      filteredContacts = filteredContacts.filter(c => c.needsReview === false);
    }
    
    // Apply sorting
    filteredContacts.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = `${a.lastName || ''} ${a.firstName || ''}`;
          bVal = `${b.lastName || ''} ${b.firstName || ''}`;
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'company':
          aVal = a.company || '';
          bVal = b.company || '';
          break;
        case 'title':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    // Calculate pagination
    const totalCount = filteredContacts.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedContacts = filteredContacts.slice(offset, offset + Number(limit));
    
    // Return contacts with event data
    res.json({
      success: true,
      contacts: paginatedContacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all contacts:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}