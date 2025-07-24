import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, User, Mail, Phone, Building, Briefcase, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ReviewModal } from './ReviewModal';

interface FieldConfidence {
  firstName?: number;
  lastName?: number;
  email?: number;
  phone?: number;
  company?: number;
  title?: number;
  industry?: number;
  address?: number;
}

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  industry: string | null;
  address: string | null;
  imageUrl: string | null;
  needsReview: boolean;
  fieldConfidenceScores: FieldConfidence;
  createdAt: string;
}

interface ReviewQueueProps {
  eventId: string;
}

export function ReviewQueue({ eventId }: ReviewQueueProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContactsNeedingReview();
  }, [eventId]);

  const fetchContactsNeedingReview = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/needs-review?eventId=${eventId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const data = await response.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleContactUpdate = async (updatedContact: Contact) => {
    // Update local state
    setContacts(prev => prev.filter(c => c.id !== updatedContact.id));
    setShowModal(false);
    setSelectedContact(null);
  };

  const getFieldIcon = (field: keyof Contact) => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return <User className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'title':
        return <Briefcase className="h-4 w-4" />;
      case 'address':
        return <MapPin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getLowConfidenceFields = (contact: Contact): string[] => {
    const fields: string[] = [];
    const scores = contact.fieldConfidenceScores;
    
    if (scores.firstName && scores.firstName < 0.7) fields.push('firstName');
    if (scores.lastName && scores.lastName < 0.7) fields.push('lastName');
    if (scores.email && scores.email < 0.7) fields.push('email');
    if (scores.phone && scores.phone < 0.7) fields.push('phone');
    if (scores.company && scores.company < 0.7) fields.push('company');
    if (scores.title && scores.title < 0.7) fields.push('title');
    if (scores.industry && scores.industry < 0.7) fields.push('industry');
    if (scores.address && scores.address < 0.7) fields.push('address');
    
    return fields;
  };

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      title: 'Title',
      industry: 'Industry',
      address: 'Address'
    };
    return fieldNames[field] || field;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading review queue...</div>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No contacts need review at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Review Queue</h2>
            <p className="text-gray-600 mt-1">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} need{contacts.length === 1 ? 's' : ''} review
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            {contacts.length}
          </Badge>
        </div>

        {contacts.map((contact) => {
          const lowConfidenceFields = getLowConfidenceFields(contact);
          
          return (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {contact.firstName || '???'} {contact.lastName || '???'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Added {new Date(contact.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleReviewClick(contact)}
                    size="sm"
                  >
                    Review
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  {contact.title && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>{contact.title}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Fields needing review:</p>
                  <div className="flex flex-wrap gap-2">
                    {lowConfidenceFields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {getFieldIcon(field as keyof Contact)}
                        <span className="ml-1">{formatFieldName(field)}</span>
                        <span className="ml-2 text-orange-600">
                          {Math.round((contact.fieldConfidenceScores[field as keyof FieldConfidence] || 0) * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showModal && selectedContact && (
        <ReviewModal
          contact={selectedContact}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedContact(null);
          }}
          onSave={handleContactUpdate}
        />
      )}
    </>
  );
}