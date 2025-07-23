import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { 
  Image as ImageIcon, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  website?: string;
  notes?: string;
}

interface OCRPreviewProps {
  image: string | File;
  extractedData?: LeadData;
  onConfirm: (data: LeadData) => void;
  onSkip?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

function FormField({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  error, 
  required,
  placeholder 
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={label} className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={label}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && "border-destructive")}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function OCRPreview({ 
  image, 
  extractedData, 
  onConfirm, 
  onSkip,
  onCancel,
  isProcessing = false 
}: OCRPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [editedData, setEditedData] = useState<LeadData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    website: '',
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  useEffect(() => {
    // Handle File or string URL
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(image);
    }
  }, [image]);

  useEffect(() => {
    if (extractedData) {
      setEditedData(extractedData);
      // Auto-validate on data load
      validateAllFields(extractedData);
    }
  }, [extractedData]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateField = (field: keyof LeadData, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else {
          delete errors.name;
        }
        break;
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!isValidEmail(value)) {
          errors.email = 'Invalid email format';
        } else {
          delete errors.email;
        }
        break;
      case 'phone':
        if (value && !isValidPhone(value)) {
          errors.phone = 'Invalid phone format';
        } else {
          delete errors.phone;
        }
        break;
      case 'website':
        if (value && !isValidUrl(value)) {
          errors.website = 'Invalid URL format';
        } else {
          delete errors.website;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  const validateAllFields = (data: LeadData) => {
    const errors: Record<string, string> = {};
    
    if (!data.name.trim()) errors.name = 'Name is required';
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }
    if (data.phone && !isValidPhone(data.phone)) {
      errors.phone = 'Invalid phone format';
    }
    if (data.website && !isValidUrl(data.website)) {
      errors.website = 'Invalid URL format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: keyof LeadData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    setShowValidationSummary(false);
  };

  const handleConfirm = () => {
    if (validateAllFields(editedData)) {
      onConfirm(editedData);
    } else {
      setShowValidationSummary(true);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (isProcessing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
        {/* Image skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[500px]" />
          </CardContent>
        </Card>

        {/* Form skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processing...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Extracting information from business card...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-h-[90vh]">
      {/* Image Preview Panel */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Business Card
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto h-[calc(100%-4rem)]">
          <div className="p-4 min-h-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt="Business card" 
              className="max-w-full h-auto transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data Form Panel */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extracted Information
            </CardTitle>
            <Badge variant={Object.keys(validationErrors).length > 0 ? "destructive" : "success"}>
              {Object.keys(validationErrors).length > 0 
                ? `${Object.keys(validationErrors).length} issues`
                : 'Valid'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto h-[calc(100%-4rem)]">
          <div className="space-y-4 py-4">
            {showValidationSummary && Object.keys(validationErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the validation errors before saving.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              label="Full Name"
              value={editedData.name}
              onChange={(value) => handleFieldChange('name', value)}
              error={validationErrors.name}
              required
              placeholder="John Doe"
            />
            
            <FormField
              label="Email"
              type="email"
              value={editedData.email}
              onChange={(value) => handleFieldChange('email', value)}
              error={validationErrors.email}
              required
              placeholder="john@example.com"
            />
            
            <FormField
              label="Phone"
              type="tel"
              value={editedData.phone}
              onChange={(value) => handleFieldChange('phone', value)}
              error={validationErrors.phone}
              placeholder="+1 (555) 123-4567"
            />
            
            <FormField
              label="Company"
              value={editedData.company}
              onChange={(value) => handleFieldChange('company', value)}
              placeholder="Acme Corp"
            />
            
            <FormField
              label="Position"
              value={editedData.position}
              onChange={(value) => handleFieldChange('position', value)}
              placeholder="Marketing Manager"
            />

            <FormField
              label="Website"
              value={editedData.website || ''}
              onChange={(value) => handleFieldChange('website', value)}
              error={validationErrors.website}
              placeholder="www.example.com"
            />

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm">Notes</Label>
              <textarea
                id="notes"
                value={editedData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleConfirm}
                disabled={Object.keys(validationErrors).length > 0}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
              
              {onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                >
                  Skip
                </Button>
              )}
              
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}