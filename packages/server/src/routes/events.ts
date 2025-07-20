import { Router } from 'express';
import { eventController } from '../controllers/eventController';

const router = Router();

// Get all events
router.get('/', eventController.getAllEvents);

// Get single event by ID
router.get('/:id', eventController.getEventById);

// Create new event
router.post('/', eventController.createEvent);

// Update event
router.put('/:id', eventController.updateEvent);

// Delete event
router.delete('/:id', eventController.deleteEvent);

export default router;