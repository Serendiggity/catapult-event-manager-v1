import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CampaignGroupsList } from '../components/campaignGroups/CampaignGroupsList';
import { Button } from '../components/ui/button';
import { ArrowLeft, Mail, ChevronRight, Plus } from 'lucide-react';
import { CampaignGroupForm } from '../components/campaignGroups/CampaignGroupForm';

export function CampaignGroupsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventTitle, setEventTitle] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventTitle();
    }
  }, [eventId]);

  const fetchEventTitle = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEventTitle(data.title || '');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-4">
        <Link to="/events" className="hover:text-blue-600">Events</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to={`/events/${eventId}`} className="hover:text-blue-600">
          {eventTitle || 'Event'}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">Campaign Groups</span>
      </nav>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/events/${eventId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
          <Button
            onClick={() => navigate(`/events/${eventId}/campaigns`)}
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Campaigns
          </Button>
        </div>
      </div>

      <CampaignGroupsList eventId={eventId} />
      
      {showCreateForm && (
        <CampaignGroupForm
          eventId={eventId}
          group={null}
          onClose={() => {
            setShowCreateForm(false);
            // Force refresh of the list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}