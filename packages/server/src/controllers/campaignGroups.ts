import { Request, Response } from 'express';
import { getDb } from '../db/connection';
import { campaignGroups, contactsToCampaignGroups, NewCampaignGroup } from '../db/schema/campaign-groups';
import { contacts } from '../db/schema/contacts';
import { eq, and, sql, inArray } from 'drizzle-orm';

// Get all campaign groups for an event
export async function getCampaignGroups(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    const groups = await getDb()
      .select()
      .from(campaignGroups)
      .where(eq(campaignGroups.eventId, eventId))
      .orderBy(campaignGroups.createdAt);
    
    res.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Error fetching campaign groups:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign groups'
    });
  }
}

// Get a specific campaign group with its contacts
export async function getCampaignGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get the campaign group
    const [group] = await getDb()
      .select()
      .from(campaignGroups)
      .where(eq(campaignGroups.id, id));
    
    if (!group) {
      return res.status(404).json({
        error: 'Campaign group not found'
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
        addedAt: contactsToCampaignGroups.addedAt
      })
      .from(contacts)
      .innerJoin(
        contactsToCampaignGroups,
        eq(contacts.id, contactsToCampaignGroups.contactId)
      )
      .where(eq(contactsToCampaignGroups.campaignGroupId, id))
      .orderBy(contactsToCampaignGroups.addedAt);
    
    res.json({
      success: true,
      group: {
        ...group,
        contacts: groupContacts
      }
    });
  } catch (error) {
    console.error('Error fetching campaign group:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign group'
    });
  }
}

// Create a new campaign group
export async function createCampaignGroup(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Group name is required'
      });
    }
    
    const newGroup: NewCampaignGroup = {
      eventId,
      name,
      description: description || null,
      color: color || '#3B82F6'
    };
    
    const [createdGroup] = await getDb()
      .insert(campaignGroups)
      .values(newGroup)
      .returning();
    
    res.status(201).json({
      success: true,
      group: createdGroup
    });
  } catch (error) {
    console.error('Error creating campaign group:', error);
    res.status(500).json({
      error: 'Failed to create campaign group'
    });
  }
}

// Update a campaign group
export async function updateCampaignGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.eventId;
    delete updates.createdAt;
    delete updates.contactCount;
    
    const [updatedGroup] = await getDb()
      .update(campaignGroups)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(campaignGroups.id, id))
      .returning();
    
    if (!updatedGroup) {
      return res.status(404).json({
        error: 'Campaign group not found'
      });
    }
    
    res.json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating campaign group:', error);
    res.status(500).json({
      error: 'Failed to update campaign group'
    });
  }
}

// Delete a campaign group
export async function deleteCampaignGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const [deletedGroup] = await getDb()
      .delete(campaignGroups)
      .where(eq(campaignGroups.id, id))
      .returning();
    
    if (!deletedGroup) {
      return res.status(404).json({
        error: 'Campaign group not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Campaign group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign group:', error);
    res.status(500).json({
      error: 'Failed to delete campaign group'
    });
  }
}

// Add contacts to a campaign group
export async function addContactsToGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { contactIds } = req.body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        error: 'Contact IDs array is required'
      });
    }
    
    // Verify the campaign group exists
    const [group] = await getDb()
      .select()
      .from(campaignGroups)
      .where(eq(campaignGroups.id, id));
    
    if (!group) {
      return res.status(404).json({
        error: 'Campaign group not found'
      });
    }
    
    // Prepare values for insertion
    const values = contactIds.map(contactId => ({
      campaignGroupId: id,
      contactId
    }));
    
    // Insert contacts, ignoring duplicates
    await getDb()
      .insert(contactsToCampaignGroups)
      .values(values)
      .onConflictDoNothing();
    
    // Update the contact count
    const contactCount = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(contactsToCampaignGroups)
      .where(eq(contactsToCampaignGroups.campaignGroupId, id));
    
    await getDb()
      .update(campaignGroups)
      .set({ contactCount: contactCount[0].count })
      .where(eq(campaignGroups.id, id));
    
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

// Remove contacts from a campaign group
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
      .delete(contactsToCampaignGroups)
      .where(
        and(
          eq(contactsToCampaignGroups.campaignGroupId, id),
          inArray(contactsToCampaignGroups.contactId, contactIds)
        )
      );
    
    // Update the contact count
    const contactCount = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(contactsToCampaignGroups)
      .where(eq(contactsToCampaignGroups.campaignGroupId, id));
    
    await getDb()
      .update(campaignGroups)
      .set({ contactCount: contactCount[0].count })
      .where(eq(campaignGroups.id, id));
    
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
    const baseQuery = getDb()
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
    
    let availableContacts;
    
    // If groupId is provided, exclude contacts already in that group
    if (groupId && typeof groupId === 'string') {
      const contactsInGroup = await getDb()
        .select({ contactId: contactsToCampaignGroups.contactId })
        .from(contactsToCampaignGroups)
        .where(eq(contactsToCampaignGroups.campaignGroupId, groupId));
      
      const contactIdsInGroup = contactsInGroup.map(c => c.contactId);
      
      if (contactIdsInGroup.length > 0) {
        availableContacts = await baseQuery
          .where(and(
            eq(contacts.eventId, eventId),
            sql`${contacts.id} NOT IN (${contactIdsInGroup.map(() => '?').join(', ')})`,
            ...contactIdsInGroup
          ))
          .orderBy(contacts.createdAt);
      } else {
        availableContacts = await baseQuery.orderBy(contacts.createdAt);
      }
    } else {
      availableContacts = await baseQuery.orderBy(contacts.createdAt);
    }
    
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