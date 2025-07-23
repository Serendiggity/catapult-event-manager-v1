import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { CreateCampaignModalEnhanced } from './CreateCampaignModalEnhanced';

interface CreateCampaignModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEventId?: string;
}

export function CreateCampaignModalGlobal({ 
  isOpen, 
  onClose, 
  preselectedEventId 
}: CreateCampaignModalGlobalProps) {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || '');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const result = await response.json();
      const eventsData = result.data || result;
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (selectedEventId) {
      setShowCreateModal(true);
    }
  };

  const handleClose = () => {
    setSelectedEventId(preselectedEventId || '');
    setShowCreateModal(false);
    onClose();
  };

  // If we have a preselected event and are showing the modal, skip the selection step
  if (preselectedEventId && showCreateModal) {
    return (
      <CreateCampaignModalEnhanced
        eventId={preselectedEventId}
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={() => {
          navigate(`/campaigns`);
          handleClose();
        }}
      />
    );
  }

  // If showing the create modal with a selected event
  if (showCreateModal && selectedEventId) {
    return (
      <CreateCampaignModalEnhanced
        eventId={selectedEventId}
        isOpen={true}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          navigate(`/campaigns`);
          handleClose();
        }}
      />
    );
  }

  // Show event selection dialog
  return (
    <Dialog open={isOpen && !showCreateModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create AI Campaign
          </DialogTitle>
          <DialogDescription>
            Select an event to create an email campaign for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : events.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No events found. Please create an event first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="event">Select Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex flex-col">
                        <span>{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleProceed} 
            disabled={!selectedEventId || loading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}