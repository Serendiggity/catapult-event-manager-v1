import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LeadGroupsList } from '../components/leadGroups/LeadGroupsList';
import { Button } from '../components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

export function LeadGroupsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(`/events/${eventId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
        <Button
          onClick={() => navigate(`/events/${eventId}/campaigns`)}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email Campaigns
        </Button>
      </div>

      <LeadGroupsList eventId={eventId} />
    </div>
  );
}