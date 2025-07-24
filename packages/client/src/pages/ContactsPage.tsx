import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BusinessCardUpload } from '../components/contacts/BusinessCardUpload';
import { OCRProcessor } from '../components/contacts/OCRProcessor';
import { Button } from '../components/ui/button';
import { ArrowLeft, ChevronRight, Send } from 'lucide-react';

type ProcessingState = 'upload' | 'processing' | 'complete' | 'error';

export function ContactsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<ProcessingState>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setState('processing');
  };

  const handleProcessingComplete = (newContactId: string) => {
    setContactId(newContactId);
    setState('complete');
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  };

  const handleReset = () => {
    setState('upload');
    setCapturedImage(null);
    setContactId(null);
    setError(null);
  };

  const handleViewContact = () => {
    if (contactId) {
      navigate(`/contacts/${contactId}`);
    }
  };

  const handleViewReviewQueue = () => {
    navigate(`/events/${eventId}/review`);
  };

  const handleSendEmail = () => {
    if (contactId) {
      navigate(`/quick-email?to=${contactId}`);
    }
  };

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
        <span className="text-gray-900">Add Lead</span>
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
        
        <h1 className="text-3xl font-bold">Add Lead</h1>
        <p className="text-gray-600 mt-2">
          Capture or upload a business card to add a new lead
        </p>
      </div>

      {state === 'upload' && (
        <BusinessCardUpload
          eventId={eventId}
          onImageCapture={handleImageCapture}
        />
      )}

      {state === 'processing' && capturedImage && (
        <OCRProcessor
          imageData={capturedImage}
          eventId={eventId}
          onComplete={handleProcessingComplete}
          onError={handleProcessingError}
        />
      )}

      {state === 'complete' && (
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              Lead Added Successfully!
            </h2>
            <p className="text-green-700">
              The business card has been processed and the lead has been saved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={handleSendEmail} variant="default" size="lg" className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button onClick={handleViewContact} variant="outline" className="w-full sm:w-auto">
              View Lead
            </Button>
            <Button onClick={handleReset} variant="secondary" className="w-full sm:w-auto">
              Add Another
            </Button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-red-800 mb-2">
              Processing Failed
            </h2>
            <p className="text-red-700">{error}</p>
          </div>
          
          <Button onClick={handleReset} variant="default">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}