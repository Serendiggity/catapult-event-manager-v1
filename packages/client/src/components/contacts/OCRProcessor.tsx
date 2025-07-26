import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ManualContactForm } from './ManualContactForm';

interface OCRProcessorProps {
  imageData: string;
  eventId: string;
  onComplete: (contactId: string) => void;
  onError: (error: string) => void;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress?: number;
}

export function OCRProcessor({ imageData, eventId, onComplete, onError }: OCRProcessorProps) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { name: 'Extracting text from image', status: 'pending' },
    { name: 'Parsing contact information', status: 'pending' },
    { name: 'Saving contact', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [lowConfidenceData, setLowConfidenceData] = useState<any>(null);

  useEffect(() => {
    processBusinessCard();
  }, [imageData]);

  const updateStep = (index: number, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const processBusinessCard = async () => {
    try {
      // Step 1: Extract text using Tesseract.js
      setCurrentStep(0);
      updateStep(0, { status: 'processing' });
      
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            updateStep(0, { progress: Math.round(m.progress * 100) });
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      
      updateStep(0, { status: 'complete', progress: 100 });
      
      // Step 2: Send to backend for AI parsing
      setCurrentStep(1);
      updateStep(1, { status: 'processing' });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ocrText: text,
          imageUrl: imageData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process business card');
      }

      const result = await response.json();
      
      // Check if low confidence response
      if (result.lowConfidence) {
        updateStep(1, { status: 'complete' });
        updateStep(2, { status: 'pending' });
        
        // Show manual form with pre-filled data
        setLowConfidenceData({
          parsedData: result.parsedData,
          overallConfidence: result.overallConfidence
        });
        setShowManualForm(true);
        
        toast({
          title: "Manual review required",
          description: result.message,
          variant: "default"
        });
        return;
      }
      
      updateStep(1, { status: 'complete' });
      
      // Step 3: Contact saved
      setCurrentStep(2);
      updateStep(2, { status: 'complete' });
      
      toast({
        title: "Lead created successfully",
        description: "The business card has been processed and the lead has been added.",
      });
      
      // Complete the process
      setTimeout(() => {
        onComplete(result.contact.id);
      }, 500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      updateStep(currentStep, { status: 'error' });
      onError(errorMessage);
    }
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (showManualForm && lowConfidenceData) {
    return (
      <ManualContactForm
        eventId={eventId}
        parsedData={lowConfidenceData.parsedData}
        overallConfidence={lowConfidenceData.overallConfidence}
        imageData={imageData}
        onComplete={onComplete}
        onError={onError}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Processing Business Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'processing' ? 'text-blue-600' :
                  step.status === 'complete' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </p>
                {step.status === 'processing' && step.progress !== undefined && (
                  <Progress value={step.progress} className="mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center pt-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Please wait while we process your business card...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}