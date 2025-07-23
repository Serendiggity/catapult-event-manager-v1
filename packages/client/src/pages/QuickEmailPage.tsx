import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, ArrowLeft, User, Mail as MailIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  eventId: string;
}

interface Event {
  id: string;
  title: string;
}

export function QuickEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contactId = searchParams.get('to');
  const contactIds = searchParams.get('contacts')?.split(',').filter(Boolean);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (contactId || contactIds) {
      loadContactsAndEvent();
    } else {
      navigate('/events');
    }
  }, [contactId, contactIds]);
  
  const loadContactsAndEvent = async () => {
    try {
      setLoading(true);
      
      // Load contact(s)
      let contactList: Contact[] = [];
      
      if (contactId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/${contactId}`);
        if (!response.ok) throw new Error('Failed to load contact');
        const data = await response.json();
        contactList = [data];
      } else if (contactIds) {
        // Load multiple contacts
        const promises = contactIds.map(id => 
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/${id}`)
            .then(r => r.json())
        );
        contactList = await Promise.all(promises);
      }
      
      setContacts(contactList);
      
      // Load event details
      if (contactList.length > 0 && contactList[0].eventId) {
        const eventResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events/${contactList[0].eventId}`);
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEvent(eventData);
          
          // Set default subject
          setSubject(`Great meeting you at ${eventData.title}`);
          
          // Set default message with personalization
          const firstName = contactList[0].firstName || 'there';
          setMessage(`Hi ${firstName},

It was great meeting you at ${eventData.title}. I enjoyed our conversation about [topic].

I'd love to continue our discussion. Would you be available for a quick call next week?

Best regards,
[Your name]`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message');
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      // Create a quick campaign
      const campaignData = {
        eventId: contacts[0].eventId,
        name: `Quick email to ${contacts.map(c => c.firstName).join(', ')}`,
        subject,
        templateBody: message,
        contactIds: contacts.map(c => c.id),
        sendImmediately: true
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate(-1);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800 text-lg">
            ✅ Email sent successfully! Redirecting...
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Quick Email</CardTitle>
          <div className="text-sm text-muted-foreground mt-2">
            Sending to: {contacts.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1 mr-3">
                <User className="h-3 w-3" />
                {c.firstName} {c.lastName}
                {c.email && (
                  <>
                    <MailIcon className="h-3 w-3 ml-1" />
                    {c.email}
                  </>
                )}
              </span>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={12}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Personalize your message! Variables like {'{firstName}'} will be automatically replaced.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}