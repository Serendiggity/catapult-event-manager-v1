import { Router } from 'express';
import {
  createContactFromOCR,
  getContactsNeedingReview,
  updateContactAfterReview,
  getContactsByEvent,
  getAllContacts
} from '../controllers/contacts';

const router = Router();

// Get all contacts with search, filter, sort, and pagination
router.get('/', getAllContacts);

// Create a new contact from OCR data
router.post('/ocr', createContactFromOCR);

// Get all contacts needing review (optionally filtered by event)
router.get('/needs-review', getContactsNeedingReview);

// Get all contacts for a specific event
router.get('/event/:eventId', getContactsByEvent);

// Get a specific contact by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { getDb } = await import('../db/connection');
    const { contacts } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');
    
    const [contact] = await getDb()
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Update a contact after manual review
router.patch('/:id', updateContactAfterReview);

// Delete a contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { getDb } = await import('../db/connection');
    const { contacts } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');
    
    const result = await getDb().delete(contacts).where(eq(contacts.id, id));
    
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;