import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  addedAt?: string;
}

interface CampaignGroup {
  id: string;
  name: string;
  color: string;
}

interface ManageGroupContactsProps {
  group: CampaignGroup;
  eventId: string;
  onClose: () => void;
}

export function ManageGroupContacts({ group, eventId, onClose }: ManageGroupContactsProps) {
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'view' | 'add'>('view');

  useEffect(() => {
    fetchContacts();
  }, [group.id, eventId]);

  const fetchContacts = async () => {
    try {
      // Fetch group contacts
      const groupResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/${group.id}`
      );
      if (!groupResponse.ok) throw new Error('Failed to fetch group');
      const groupData = await groupResponse.json();
      setGroupContacts(groupData.group.contacts || []);

      // Fetch available contacts
      const availableResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/event/${eventId}/available-contacts?groupId=${group.id}`
      );
      if (!availableResponse.ok) throw new Error('Failed to fetch available contacts');
      const availableData = await availableResponse.json();
      setAvailableContacts(availableData.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContacts = async () => {
    if (selectedContacts.size === 0) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/${group.id}/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: Array.from(selectedContacts)
          })
        }
      );

      if (!response.ok) throw new Error('Failed to add contacts');
      
      setSelectedContacts(new Set());
      setMode('view');
      await fetchContacts();
    } catch (error) {
      console.error('Error adding contacts:', error);
      alert('Failed to add leads to group');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveContacts = async () => {
    if (selectedContacts.size === 0) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/${group.id}/contacts`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: Array.from(selectedContacts)
          })
        }
      );

      if (!response.ok) throw new Error('Failed to remove contacts');
      
      setSelectedContacts(new Set());
      await fetchContacts();
    } catch (error) {
      console.error('Error removing contacts:', error);
      alert('Failed to remove leads from group');
    } finally {
      setSaving(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const getContactName = (contact: Contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.email || 'Unknown Lead';
  };

  const filteredContacts = (mode === 'view' ? groupContacts : availableContacts).filter(contact => {
    if (!searchTerm) return true;
    const name = getContactName(contact).toLowerCase();
    const email = (contact.email || '').toLowerCase();
    const company = (contact.company || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term) || company.includes(term);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <h2 className="text-xl font-bold">{group.name}</h2>
              <Badge variant="secondary">
                {groupContacts.length} lead{groupContacts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 border-b flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="pl-10"
            />
          </div>
          
          {mode === 'view' ? (
            <>
              <Button
                onClick={() => setMode('add')}
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Leads
              </Button>
              {selectedContacts.size > 0 && (
                <Button
                  onClick={handleRemoveContacts}
                  variant="destructive"
                  disabled={saving}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Selected ({selectedContacts.size})
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setMode('view');
                  setSelectedContacts(new Set());
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContacts}
                disabled={selectedContacts.size === 0 || saving}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Selected ({selectedContacts.size})
              </Button>
            </>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg font-semibold">Loading leads...</div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {mode === 'view' 
                ? 'No leads in this group yet'
                : searchTerm 
                  ? 'No leads found matching your search'
                  : 'No available leads to add'
              }
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => toggleContactSelection(contact.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{getContactName(contact)}</div>
                    <div className="text-sm text-gray-600 space-x-4">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.company && <span>{contact.company}</span>}
                      {contact.title && <span>{contact.title}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}