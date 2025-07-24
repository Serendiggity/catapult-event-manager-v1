import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { INDUSTRIES } from '@new-era-event-manager/shared/src/constants/industries';

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

interface ReviewModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export function ReviewModal({ contact, isOpen, onClose, onSave }: ReviewModalProps) {
  const [formData, setFormData] = useState({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    title: contact.title || '',
    industry: contact.industry || '',
    address: contact.address || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        industry: contact.industry || '',
        address: contact.address || ''
      });
      setError(null);
    }
  }, [isOpen, contact]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/${contact.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update contact');
      }

      const data = await response.json();
      onSave(data.contact);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getFieldConfidence = (field: keyof FieldConfidence): number => {
    return contact.fieldConfidenceScores[field] || 0;
  };

  const isLowConfidence = (field: keyof FieldConfidence): boolean => {
    return getFieldConfidence(field) < 0.7;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Review Contact Information</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {contact.imageUrl && (
            <div className="mb-6">
              <Label>Business Card Image</Label>
              <img
                src={contact.imageUrl}
                alt="Business card"
                className="mt-2 max-w-full h-auto rounded-lg border"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="firstName">First Name</Label>
                  {isLowConfidence('firstName') && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {Math.round(getFieldConfidence('firstName') * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={isLowConfidence('firstName') ? 'border-orange-400' : ''}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isLowConfidence('lastName') && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {Math.round(getFieldConfidence('lastName') * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={isLowConfidence('lastName') ? 'border-orange-400' : ''}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="email">Email</Label>
                {isLowConfidence('email') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('email') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={isLowConfidence('email') ? 'border-orange-400' : ''}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="phone">Phone</Label>
                {isLowConfidence('phone') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('phone') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={isLowConfidence('phone') ? 'border-orange-400' : ''}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="company">Company</Label>
                {isLowConfidence('company') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('company') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className={isLowConfidence('company') ? 'border-orange-400' : ''}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="title">Title</Label>
                {isLowConfidence('title') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('title') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={isLowConfidence('title') ? 'border-orange-400' : ''}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="industry">Industry</Label>
                {isLowConfidence('industry') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('industry') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger 
                  id="industry"
                  className={isLowConfidence('industry') ? 'border-orange-400' : ''}
                >
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="address">Address</Label>
                {isLowConfidence('address') && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {Math.round(getFieldConfidence('address') * 100)}% confidence
                  </Badge>
                )}
              </div>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={isLowConfidence('address') ? 'border-orange-400' : ''}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}