import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Calendar, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LeadGroup {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  color: string;
  contactCount: number;
  event?: {
    id: string;
    title: string;
    date: string;
  };
}

export function AllLeadGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all events
      const eventsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');
      const eventsResult = await eventsResponse.json();
      
      // Handle both direct array and API response object formats
      const eventsData = eventsResult.data || eventsResult;
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);

      // Fetch lead groups for all events
      const groupsPromises = eventsArray.map(async (event: any) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/event/${event.id}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        // Handle both direct array and object with groups property
        const groups = data.groups || data;
        const groupsArray = Array.isArray(groups) ? groups : [];
        return groupsArray.map((group: LeadGroup) => ({
          ...group,
          event: {
            id: event.id,
            title: event.title,
            date: event.date
          }
        }));
      });

      const allGroups = await Promise.all(groupsPromises);
      setGroups(allGroups.flat());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = selectedEventId === 'all' 
    ? groups 
    : groups.filter(group => group.eventId === selectedEventId);

  const totalLeads = filteredGroups.reduce((sum, group) => sum + group.contactCount, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading lead groups..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/contacts')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Lead Groups</h1>
            <p className="text-gray-600">Organize your leads across all events</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{filteredGroups.length}</div>
            <div className="text-sm text-gray-600">Total Groups</div>
            <div className="text-xl font-semibold mt-2">{totalLeads}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </div>
        </div>
      </div>

      {/* Filter by Event */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Filter by Event:</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[300px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} - {new Date(event.date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lead Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Lead Groups Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedEventId === 'all' 
                ? "No lead groups have been created yet." 
                : "No lead groups for the selected event."}
            </p>
            {selectedEventId !== 'all' && (
              <Button onClick={() => navigate(`/events/${selectedEventId}/lead-groups`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Lead Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card 
              key={group.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/events/${group.eventId}/lead-groups`)}
            >
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
                {group.event && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {group.event.title}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}