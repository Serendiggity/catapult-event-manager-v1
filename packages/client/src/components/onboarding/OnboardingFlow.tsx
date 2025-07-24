import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spotlight } from './Spotlight';
import { useOnboardingStore } from '@/stores/onboarding-store';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for spotlight
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  requiredProgress?: string[]; // IDs of steps that must be completed first
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to New Era Events Manager',
    description: 'Transform your business networking with our comprehensive event and lead management platform. Let\'s take a quick tour to help you get started.',
    position: 'center',
  },
  {
    id: 'create-event',
    title: 'Create Your First Event',
    description: 'Events help you organize leads by where you met them. Click here to create your first event.',
    target: '[data-onboarding="create-event-button"]',
    position: 'bottom',
    action: {
      label: 'Create Event',
      onClick: () => window.location.href = '/events/new'
    }
  },
  {
    id: 'add-leads',
    title: 'Add Leads to Your Event',
    description: 'Scan business cards or manually add contact information. Our OCR technology makes it quick and accurate.',
    target: '[data-onboarding="add-lead-button"]',
    position: 'bottom',
    requiredProgress: ['create-event']
  },
  {
    id: 'organize-groups',
    title: 'Organize Leads into Groups',
    description: 'Create groups like "Hot Leads" or "Follow Up Later" to categorize your contacts for targeted campaigns.',
    target: '[data-onboarding="lead-groups-section"]',
    position: 'right',
    requiredProgress: ['add-leads']
  },
  {
    id: 'create-campaign',
    title: 'Send Your First Campaign',
    description: 'Ready to reach out? Create personalized email campaigns with AI assistance.',
    target: '[data-onboarding="create-campaign-button"]',
    position: 'left',
    requiredProgress: ['organize-groups']
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'ve learned the basics of New Era Events Manager. Start organizing your events and managing your professional network effectively.',
    position: 'center',
  }
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  className?: string;
}

export function OnboardingFlow({ onComplete, className }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { 
    currentStep, 
    completedSteps, 
    isVisible, 
    setCurrentStep, 
    completeStep, 
    hideOnboarding,
    resetOnboarding 
  } = useOnboardingStore();
  
  const [isMinimized, setIsMinimized] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  useEffect(() => {
    // Check if we should auto-advance based on completed actions
    const checkAutoAdvance = () => {
      if (step.requiredProgress) {
        const allCompleted = step.requiredProgress.every(id => 
          completedSteps.includes(id)
        );
        if (!allCompleted) {
          // Find the first incomplete required step
          const incompleteStep = step.requiredProgress.find(id => 
            !completedSteps.includes(id)
          );
          const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === incompleteStep);
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex);
          }
        }
      }
    };

    checkAutoAdvance();
  }, [currentStep, completedSteps, step.requiredProgress, setCurrentStep]);

  if (!isVisible || !step) return null;

  const handleNext = () => {
    completeStep(step.id);
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    hideOnboarding();
    onComplete?.();
  };

  const handleComplete = () => {
    hideOnboarding();
    localStorage.setItem('onboarding-completed', 'true');
    onComplete?.();
  };

  const renderContent = () => (
    <Card className={cn(
      "w-full max-w-md shadow-lg border-2",
      isMinimized && "max-w-xs"
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{step.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        {!isMinimized && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {step.description}
            </p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Completed steps indicator */}
            {completedSteps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {completedSteps.map(stepId => {
                  const completedStep = ONBOARDING_STEPS.find(s => s.id === stepId);
                  return completedStep ? (
                    <div
                      key={stepId}
                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {completedStep.title.split(' ').slice(0, 2).join(' ')}
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  Skip Tour
                </Button>
                
                {step.action ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      step.action!.onClick();
                      handleNext();
                    }}
                  >
                    {step.action.label}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                  >
                    {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Minimized view */}
        {isMinimized && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Onboarding Tour</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Center position for welcome/complete steps
  if (step.position === 'center' || !step.target) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-background/80 backdrop-blur-sm animate-in fade-in duration-200",
        className
      )}>
        {renderContent()}
      </div>
    );
  }

  // Spotlight for specific elements
  return (
    <Spotlight
      target={step.target}
      position={step.position}
      onClickOutside={() => setIsMinimized(true)}
      className={className}
    >
      {renderContent()}
    </Spotlight>
  );
}