import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@catapult-event-manager/shared';

interface ContactWithConfidence extends Contact {
  fieldConfidenceScores?: {
    firstName?: number;
    lastName?: number;
    email?: number;
    phone?: number;
    company?: number;
    title?: number;
    address?: number;
  };
}

export function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [contact, setContact] = useState<ContactWithConfidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/contacts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Contact not found');
        }
        throw new Error('Failed to fetch contact');
      }
      
      const data = await response.json();
      setContact(data);
      setEditedContact({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        title: data.title || '',
        address: data.address || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contact) return;
    
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedContact),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      const updatedContact = await response.json();
      setContact(updatedContact);
      setEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (contact) {
      setEditedContact({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        address: contact.address || ''
      });
    }
    setEditing(false);
    setError(null);
  };

  const getConfidenceBadge = (field: keyof ContactWithConfidence['fieldConfidenceScores'], value?: string | null) => {
    if (!contact?.fieldConfidenceScores || !value) return null;
    
    const confidence = contact.fieldConfidenceScores[field];
    if (confidence === undefined) return null;
    
    const percentage = Math.round(confidence * 100);
    const variant = confidence >= 0.8 ? 'default' : confidence >= 0.6 ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="ml-2">
        {percentage}% confidence
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contact details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Contact not found'}</AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-4">
        <Link to="/contacts" className="hover:text-blue-600">Leads</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">Lead Details</span>
      </nav>

      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/contacts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lead Details</h1>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Contact updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Card Image */}
        {contact.imageUrl && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Business Card</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={contact.imageUrl}
                alt="Business card"
                className="max-w-full h-auto rounded-lg border shadow-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                {editing ? (
                  <Input
                    id="firstName"
                    value={editedContact.firstName || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, firstName: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.firstName || '-'}</p>
                    {getConfidenceBadge('firstName', contact.firstName)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                {editing ? (
                  <Input
                    id="lastName"
                    value={editedContact.lastName || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, lastName: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.lastName || '-'}</p>
                    {getConfidenceBadge('lastName', contact.lastName)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedContact.email || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.email || '-'}</p>
                    {getConfidenceBadge('email', contact.email)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={editedContact.phone || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.phone || '-'}</p>
                    {getConfidenceBadge('phone', contact.phone)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                {editing ? (
                  <Input
                    id="company"
                    value={editedContact.company || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.company || '-'}</p>
                    {getConfidenceBadge('company', contact.company)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                {editing ? (
                  <Input
                    id="title"
                    value={editedContact.title || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, title: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.title || '-'}</p>
                    {getConfidenceBadge('title', contact.title)}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                {editing ? (
                  <Input
                    id="address"
                    value={editedContact.address || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, address: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-lg">{contact.address || '-'}</p>
                    {getConfidenceBadge('address', contact.address)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contact.needsReview && (
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-2">Needs Review</Badge>
                <span className="text-sm text-gray-600">This contact has low-confidence fields</span>
              </div>
            )}
            {contact.ocrConfidence && (
              <p className="text-sm text-gray-600">
                Overall OCR Confidence: {Math.round(parseFloat(contact.ocrConfidence) * 100)}%
              </p>
            )}
            <p className="text-sm text-gray-600">
              Created: {new Date(contact.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Last Updated: {new Date(contact.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}