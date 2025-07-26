import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Save } from 'lucide-react';
import { INDUSTRIES } from '@new-era-event-manager/shared/src/constants/industries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';

interface ParsedField {
  value: string | null;
  confidence: number;
  needsReview: boolean;
}

interface ParsedData {
  firstName?: ParsedField;
  lastName?: ParsedField;
  email?: ParsedField;
  phone?: ParsedField;
  company?: ParsedField;
  title?: ParsedField;
  industry?: ParsedField;
  address?: ParsedField;
}

interface ManualContactFormProps {
  eventId: string;
  parsedData: ParsedData;
  overallConfidence: number;
  imageData?: string;
  onComplete: (contactId: string) => void;
  onError: (error: string) => void;
}

export function ManualContactForm({
  eventId,
  parsedData,
  overallConfidence,
  imageData,
  onComplete,
  onError
}: ManualContactFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: parsedData.firstName?.value || '',
    lastName: parsedData.lastName?.value || '',
    email: parsedData.email?.value || '',
    phone: parsedData.phone?.value || '',
    company: parsedData.company?.value || '',
    title: parsedData.title?.value || '',
    industry: parsedData.industry?.value || '',
    address: parsedData.address?.value || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName && !formData.lastName && !formData.email) {
      toast({
        title: "Missing required fields",
        description: "Please provide at least a name or email address.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventId,
          imageUrl: imageData,
          needsReview: false, // Manually entered, so doesn't need review
          ocrConfidence: overallConfidence.toString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create contact');
      }

      const result = await response.json();
      
      toast({
        title: "Lead created successfully",
        description: "The contact has been saved to your database.",
      });
      
      onComplete(result.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save contact';
      onError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getFieldConfidence = (field: ParsedField | undefined) => {
    if (!field) return null;
    const percentage = Math.round(field.confidence * 100);
    const color = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
    return <span className={`text-xs ${color}`}>({percentage}% confidence)</span>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Manual Entry Required</CardTitle>
        <CardDescription>
          OCR confidence is low ({Math.round(overallConfidence * 100)}%). Please review and correct the information below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The highlighted fields had low confidence during OCR processing. Please verify all information before saving.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                First Name {getFieldConfidence(parsedData.firstName)}
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={parsedData.firstName?.confidence && parsedData.firstName.confidence < 0.7 ? 'border-yellow-500' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">
                Last Name {getFieldConfidence(parsedData.lastName)}
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={parsedData.lastName?.confidence && parsedData.lastName.confidence < 0.7 ? 'border-yellow-500' : ''}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">
              Email {getFieldConfidence(parsedData.email)}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={parsedData.email?.confidence && parsedData.email.confidence < 0.7 ? 'border-yellow-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="phone">
              Phone {getFieldConfidence(parsedData.phone)}
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={parsedData.phone?.confidence && parsedData.phone.confidence < 0.7 ? 'border-yellow-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="company">
              Company {getFieldConfidence(parsedData.company)}
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className={parsedData.company?.confidence && parsedData.company.confidence < 0.7 ? 'border-yellow-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="title">
              Job Title {getFieldConfidence(parsedData.title)}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={parsedData.title?.confidence && parsedData.title.confidence < 0.7 ? 'border-yellow-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="industry">
              Industry {getFieldConfidence(parsedData.industry)}
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger 
                id="industry"
                className={parsedData.industry?.confidence && parsedData.industry.confidence < 0.7 ? 'border-yellow-500' : ''}
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
            <Label htmlFor="address">
              Address {getFieldConfidence(parsedData.address)}
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={parsedData.address?.confidence && parsedData.address.confidence < 0.7 ? 'border-yellow-500' : ''}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}