import { Router } from 'express';
import {
  getCampaignGroups,
  getCampaignGroup,
  createCampaignGroup,
  updateCampaignGroup,
  deleteCampaignGroup,
  addContactsToGroup,
  removeContactsFromGroup,
  getAvailableContacts
} from '../controllers/campaignGroups';

const router = Router();

// Get all campaign groups for an event
router.get('/event/:eventId', getCampaignGroups);

// Get available contacts for an event (not in specified group)
router.get('/event/:eventId/available-contacts', getAvailableContacts);

// Get a specific campaign group with its contacts
router.get('/:id', getCampaignGroup);

// Create a new campaign group
router.post('/event/:eventId', createCampaignGroup);

// Update a campaign group
router.patch('/:id', updateCampaignGroup);

// Delete a campaign group
router.delete('/:id', deleteCampaignGroup);

// Add contacts to a campaign group
router.post('/:id/contacts', addContactsToGroup);

// Remove contacts from a campaign group
router.delete('/:id/contacts', removeContactsFromGroup);

export default router;