import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { events } from '../db/schema/events';
import { ApiResponse, Event } from '@new-era-event-manager/shared';

export const eventController = {
  // Get all events
  getAllEvents: async (req: Request, res: Response<ApiResponse<Event[]>>) => {
    try {
      const db = getDb();
      const allEvents = await db.select().from(events).orderBy(events.date);
      
      res.json({
        success: true,
        data: allEvents,
        message: 'Events retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // More detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isDbError = errorMessage.includes('Database not initialized') || 
                       errorMessage.includes('connection') ||
                       errorMessage.includes('ECONNREFUSED');
      
      res.status(500).json({
        success: false,
        error: isDbError ? 'Database connection error' : 'Failed to fetch events',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  },

  // Get single event by ID
  getEventById: async (req: Request, res: Response<ApiResponse<Event>>) => {
    try {
      const { id } = req.params;
      
      const db = getDb();
      const event = await db.select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      
      if (event.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }
      
      res.json({
        success: true,
        data: event[0],
        message: 'Event retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event'
      });
    }
  },

  // Create new event
  createEvent: async (req: Request, res: Response<ApiResponse<Event>>) => {
    try {
      const { title, description, location, date, capacity } = req.body;
      
      // Validate required fields
      if (!title || !date) {
        return res.status(400).json({
          success: false,
          error: 'Title and date are required'
        });
      }
      
      const db = getDb();
      const newEvent = await db.insert(events).values({
        title,
        description,
        location,
        date: new Date(date),
        capacity: capacity ? parseInt(capacity) : null
      }).returning();
      
      res.status(201).json({
        success: true,
        data: newEvent[0],
        message: 'Event created successfully'
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create event'
      });
    }
  },

  // Update event
  updateEvent: async (req: Request, res: Response<ApiResponse<Event>>) => {
    try {
      const { id } = req.params;
      const { title, description, location, date, capacity } = req.body;
      
      // Build update object with only provided fields
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (date !== undefined) updateData.date = new Date(date);
      if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null;
      
      const db = getDb();
      const updatedEvent = await db.update(events)
        .set(updateData)
        .where(eq(events.id, id))
        .returning();
      
      if (updatedEvent.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }
      
      res.json({
        success: true,
        data: updatedEvent[0],
        message: 'Event updated successfully'
      });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update event'
      });
    }
  },

  // Delete event
  deleteEvent: async (req: Request, res: Response<ApiResponse<void>>) => {
    try {
      const { id } = req.params;
      
      const db = getDb();
      const deletedEvent = await db.delete(events)
        .where(eq(events.id, id))
        .returning();
      
      if (deletedEvent.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete event'
      });
    }
  }
};