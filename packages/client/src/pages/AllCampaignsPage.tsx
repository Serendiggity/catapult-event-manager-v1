import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Plus, Calendar, ArrowLeft, Send, Edit, FileText, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { EmailCampaign } from '@catapult-event-manager/shared';

interface CampaignWithEvent extends EmailCampaign {
  event?: {
    id: string;
    title: string;
    date: string;
  };
  leadGroupCount?: number;
  draftCount?: number;
  sentCount?: number;
}

export function AllCampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithEvent[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all events
      const eventsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData);

      // Fetch campaigns for all events
      const campaignsPromises = eventsData.map(async (event: any) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/event/${event.id}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        return (data.campaigns || data).map((campaign: CampaignWithEvent) => ({
          ...campaign,
          event: {
            id: event.id,
            title: event.title,
            date: event.date
          }
        }));
      });

      const allCampaigns = await Promise.all(campaignsPromises);
      setCampaigns(allCampaigns.flat());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const eventMatch = selectedEventId === 'all' || campaign.eventId === selectedEventId;
    const statusMatch = statusFilter === 'all' || campaign.status === statusFilter;
    return eventMatch && statusMatch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
      generating: { variant: 'secondary' as const, icon: Clock, label: 'Generating' },
      ready: { variant: 'default' as const, icon: FileText, label: 'Ready' },
      sent: { variant: 'outline' as const, icon: Send, label: 'Sent' }
    };

    const style = styles[status as keyof typeof styles] || styles.draft;
    const Icon = style.icon;

    return (
      <Badge variant={style.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {style.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg font-semibold">Loading campaigns...</div>
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
          onClick={() => navigate('/events')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Campaigns</h1>
            <p className="text-gray-600">Manage all your email campaigns across events</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{filteredCampaigns.length}</div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
            <div className="text-xl font-semibold mt-2">
              {filteredCampaigns.filter(c => c.status === 'sent').length}
            </div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Event:</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-[250px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaigns Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedEventId === 'all' 
                ? "No email campaigns have been created yet." 
                : "No campaigns for the selected event."}
            </p>
            {selectedEventId !== 'all' && (
              <Button onClick={() => navigate(`/events/${selectedEventId}/campaigns`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/events/${campaign.eventId}/campaigns`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                {campaign.event && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {campaign.event.title}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Subject:</span> {campaign.subject}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created: {formatDate(campaign.createdAt)}
                  </div>
                  {campaign.status === 'sent' && (
                    <div className="text-sm text-green-600">
                      Sent: {formatDate(campaign.updatedAt)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}