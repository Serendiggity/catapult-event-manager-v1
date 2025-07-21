import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ReviewQueue } from '../components/contacts/ReviewQueue';
import { Button } from '../components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export function ReviewQueuePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventTitle, setEventTitle] = useState<string>('');

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
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-4">
        <Link to="/events" className="hover:text-blue-600">Events</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to={`/events/${eventId}`} className="hover:text-blue-600">
          {eventTitle || 'Event'}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">Review Queue</span>
      </nav>

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

      <ReviewQueue eventId={eventId} />
    </div>
  );
}