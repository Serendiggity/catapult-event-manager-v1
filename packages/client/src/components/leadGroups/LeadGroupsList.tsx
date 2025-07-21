import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LeadGroupForm } from './LeadGroupForm';
import { ManageGroupContacts } from './ManageGroupContacts';

interface LeadGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LeadGroupsListProps {
  eventId: string;
}

export function LeadGroupsList({ eventId }: LeadGroupsListProps) {
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null);
  const [managingGroup, setManagingGroup] = useState<LeadGroup | null>(null);

  useEffect(() => {
    fetchLeadGroups();
  }, [eventId]);

  const fetchLeadGroups = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/event/${eventId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch lead groups');
      
      const data = await response.json();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching lead groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEditGroup = (group: LeadGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/${groupId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) throw new Error('Failed to delete group');

      // Refresh the list
      await fetchLeadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
    fetchLeadGroups();
  };

  const handleManageContacts = (group: LeadGroup) => {
    setManagingGroup(group);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading lead groups...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Lead Groups</h2>
            <p className="text-gray-600 mt-1">
              Organize your leads into groups for targeted campaigns
            </p>
          </div>
          <Button onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lead Groups Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first lead group to start organizing leads
              </p>
              <Button onClick={handleCreateGroup}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {group.contactCount} lead{group.contactCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManageContacts(group)}
                      className="flex-1"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <LeadGroupForm
          eventId={eventId}
          group={editingGroup}
          onClose={handleFormClose}
        />
      )}

      {managingGroup && (
        <ManageGroupContacts
          group={managingGroup}
          eventId={eventId}
          onClose={() => {
            setManagingGroup(null);
            fetchLeadGroups();
          }}
        />
      )}
    </>
  );
}