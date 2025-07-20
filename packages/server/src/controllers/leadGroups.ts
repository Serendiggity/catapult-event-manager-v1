import { Request, Response } from 'express';
import { getDb } from '../db/connection';
import { leadGroups, contactsToLeadGroups, NewLeadGroup } from '../db/schema/lead-groups';
import { contacts } from '../db/schema/contacts';
import { eq, and, sql, inArray } from 'drizzle-orm';

// Get all lead groups for an event
export async function getLeadGroups(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    const groups = await getDb()
      .select()
      .from(leadGroups)
      .where(eq(leadGroups.eventId, eventId))
      .orderBy(leadGroups.createdAt);
    
    res.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Error fetching lead groups:', error);
    res.status(500).json({
      error: 'Failed to fetch lead groups'
    });
  }
}

// Get a specific lead group with its contacts
export async function getLeadGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get the lead group
    const [group] = await getDb()
      .select()
      .from(leadGroups)
      .where(eq(leadGroups.id, id));
    
    if (!group) {
      return res.status(404).json({
        error: 'Lead group not found'
      });
    }
    
    // Get contacts in this group
    const groupContacts = await getDb()
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        title: contacts.title,
        addedAt: contactsToLeadGroups.addedAt
      })
      .from(contacts)
      .innerJoin(
        contactsToLeadGroups,
        eq(contacts.id, contactsToLeadGroups.contactId)
      )
      .where(eq(contactsToLeadGroups.leadGroupId, id))
      .orderBy(contactsToLeadGroups.addedAt);
    
    res.json({
      success: true,
      group: {
        ...group,
        contacts: groupContacts
      }
    });
  } catch (error) {
    console.error('Error fetching lead group:', error);
    res.status(500).json({
      error: 'Failed to fetch lead group'
    });
  }
}

// Create a new lead group
export async function createLeadGroup(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Group name is required'
      });
    }
    
    const newGroup: NewLeadGroup = {
      eventId,
      name,
      description: description || null,
      color: color || '#3B82F6'
    };
    
    const [createdGroup] = await getDb()
      .insert(leadGroups)
      .values(newGroup)
      .returning();
    
    res.status(201).json({
      success: true,
      group: createdGroup
    });
  } catch (error) {
    console.error('Error creating lead group:', error);
    res.status(500).json({
      error: 'Failed to create lead group'
    });
  }
}

// Update a lead group
export async function updateLeadGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.eventId;
    delete updates.createdAt;
    delete updates.contactCount;
    
    const [updatedGroup] = await getDb()
      .update(leadGroups)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(leadGroups.id, id))
      .returning();
    
    if (!updatedGroup) {
      return res.status(404).json({
        error: 'Lead group not found'
      });
    }
    
    res.json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating lead group:', error);
    res.status(500).json({
      error: 'Failed to update lead group'
    });
  }
}

// Delete a lead group
export async function deleteLeadGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const [deletedGroup] = await getDb()
      .delete(leadGroups)
      .where(eq(leadGroups.id, id))
      .returning();
    
    if (!deletedGroup) {
      return res.status(404).json({
        error: 'Lead group not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lead group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead group:', error);
    res.status(500).json({
      error: 'Failed to delete lead group'
    });
  }
}

// Add contacts to a lead group
export async function addContactsToGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { contactIds } = req.body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        error: 'Contact IDs array is required'
      });
    }
    
    // Verify the lead group exists
    const [group] = await getDb()
      .select()
      .from(leadGroups)
      .where(eq(leadGroups.id, id));
    
    if (!group) {
      return res.status(404).json({
        error: 'Lead group not found'
      });
    }
    
    // Prepare values for insertion
    const values = contactIds.map(contactId => ({
      leadGroupId: id,
      contactId
    }));
    
    // Insert contacts, ignoring duplicates
    await getDb()
      .insert(contactsToLeadGroups)
      .values(values)
      .onConflictDoNothing();
    
    res.json({
      success: true,
      message: `Added ${contactIds.length} contacts to the group`
    });
  } catch (error) {
    console.error('Error adding contacts to group:', error);
    res.status(500).json({
      error: 'Failed to add contacts to group'
    });
  }
}

// Remove contacts from a lead group
export async function removeContactsFromGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { contactIds } = req.body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        error: 'Contact IDs array is required'
      });
    }
    
    await getDb()
      .delete(contactsToLeadGroups)
      .where(
        and(
          eq(contactsToLeadGroups.leadGroupId, id),
          inArray(contactsToLeadGroups.contactId, contactIds)
        )
      );
    
    res.json({
      success: true,
      message: `Removed ${contactIds.length} contacts from the group`
    });
  } catch (error) {
    console.error('Error removing contacts from group:', error);
    res.status(500).json({
      error: 'Failed to remove contacts from group'
    });
  }
}

// Get contacts not in any group for an event
export async function getAvailableContacts(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { groupId } = req.query;
    
    // Base query for contacts in this event
    let query = getDb()
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        title: contacts.title
      })
      .from(contacts)
      .where(eq(contacts.eventId, eventId));
    
    // If groupId is provided, exclude contacts already in that group
    if (groupId && typeof groupId === 'string') {
      const contactsInGroup = getDb()
        .select({ contactId: contactsToLeadGroups.contactId })
        .from(contactsToLeadGroups)
        .where(eq(contactsToLeadGroups.leadGroupId, groupId));
      
      query = query.where(
        sql`${contacts.id} NOT IN ${contactsInGroup}`
      );
    }
    
    const availableContacts = await query.orderBy(contacts.createdAt);
    
    res.json({
      success: true,
      contacts: availableContacts
    });
  } catch (error) {
    console.error('Error fetching available contacts:', error);
    res.status(500).json({
      error: 'Failed to fetch available contacts'
    });
  }
}