import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LeadGroupsList } from '../components/leadGroups/LeadGroupsList';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function LeadGroupsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/events/${eventId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
      </div>

      <LeadGroupsList eventId={eventId} />
    </div>
  );
}