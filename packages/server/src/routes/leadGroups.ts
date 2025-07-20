import { Router } from 'express';
import {
  getLeadGroups,
  getLeadGroup,
  createLeadGroup,
  updateLeadGroup,
  deleteLeadGroup,
  addContactsToGroup,
  removeContactsFromGroup,
  getAvailableContacts
} from '../controllers/leadGroups';

const router = Router();

// Get all lead groups for an event
router.get('/event/:eventId', getLeadGroups);

// Get available contacts for an event (not in specified group)
router.get('/event/:eventId/available-contacts', getAvailableContacts);

// Get a specific lead group with its contacts
router.get('/:id', getLeadGroup);

// Create a new lead group
router.post('/event/:eventId', createLeadGroup);

// Update a lead group
router.patch('/:id', updateLeadGroup);

// Delete a lead group
router.delete('/:id', deleteLeadGroup);

// Add contacts to a lead group
router.post('/:id/contacts', addContactsToGroup);

// Remove contacts from a lead group
router.delete('/:id/contacts', removeContactsFromGroup);

export default router;