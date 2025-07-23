import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { StepIndicator } from './StepIndicator';
import { AudienceStep } from './steps/AudienceStep';
import { MessageStep } from './steps/MessageStep';
import { ReviewStep } from './steps/ReviewStep';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface WizardState {
  audience: {
    eventId: string;
    campaignGroups: string[];
    estimatedRecipients: number;
  };
  message: {
    name: string;
    subject: string;
    template: string;
    useAI: boolean;
    enabledVariables: string[];
  };
  schedule: {
    sendTime: 'now' | 'scheduled';
    scheduledDate?: Date;
  };
}

const INITIAL_STATE: WizardState = {
  audience: { 
    eventId: '', 
    campaignGroups: [],
    estimatedRecipients: 0
  },
  message: { 
    name: '',
    subject: '', 
    template: '', 
    useAI: true,
    enabledVariables: ['firstName', 'lastName', 'company', 'eventName']
  },
  schedule: { 
    sendTime: 'now' 
  }
};

interface CampaignWizardProps {
  eventId?: string;
  onComplete?: (campaignId: string) => void;
}

export function CampaignWizard({ eventId, onComplete }: CampaignWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState<WizardState>({
    ...INITIAL_STATE,
    audience: {
      ...INITIAL_STATE.audience,
      eventId: eventId || ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { 
      id: 'audience', 
      label: 'Select Audience', 
      description: 'Choose which groups to email'
    },
    { 
      id: 'message', 
      label: 'Compose Message', 
      description: 'Create your email content'
    },
    { 
      id: 'review', 
      label: 'Review & Send', 
      description: 'Confirm and schedule delivery'
    }
  ];

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Audience
        return wizardState.audience.campaignGroups.length > 0;
      case 1: // Message
        return !!(
          wizardState.message.name &&
          wizardState.message.subject && 
          wizardState.message.template
        );
      case 2: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow going back to previous steps, or to next step if current is valid
    if (stepIndex < currentStep || (stepIndex === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(stepIndex);
      setError('');
    }
  };

  const handleUpdateState = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Create the campaign
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: wizardState.audience.eventId,
          name: wizardState.message.name,
          subject: wizardState.message.subject,
          templateBody: wizardState.message.template,
          campaignGroupIds: wizardState.audience.campaignGroups,
          enabledVariables: wizardState.message.enabledVariables,
          useAI: wizardState.message.useAI,
          scheduledFor: wizardState.schedule.sendTime === 'scheduled' 
            ? wizardState.schedule.scheduledDate 
            : null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const { id: campaignId } = await response.json();

      // Navigate to campaign details or trigger callback
      if (onComplete) {
        onComplete(campaignId);
      } else {
        navigate(`/campaigns/${campaignId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create Email Campaign</h1>
        <p className="text-muted-foreground">
          Follow these steps to create and send your email campaign
        </p>
      </div>

      <StepIndicator 
        steps={steps} 
        currentStep={currentStep}
        onStepClick={handleStepClick}
        isStepValid={isStepValid}
      />
      
      <Card className="mt-8">
        <CardContent className="p-6">
          {currentStep === 0 && (
            <AudienceStep
              data={wizardState}
              onUpdate={handleUpdateState}
            />
          )}
          
          {currentStep === 1 && (
            <MessageStep
              data={wizardState}
              onUpdate={handleUpdateState}
            />
          )}
          
          {currentStep === 2 && (
            <ReviewStep
              data={wizardState}
              onUpdate={handleUpdateState}
            />
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !isStepValid(currentStep)}
              >
                {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}