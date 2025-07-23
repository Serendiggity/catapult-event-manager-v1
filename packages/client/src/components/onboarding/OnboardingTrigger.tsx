import React from 'react';
import { Button } from '../ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { HelpCircle } from 'lucide-react';

// Debug component to trigger onboarding manually
export function OnboardingTrigger() {
  const { resetOnboarding, showOnboarding } = useOnboardingStore();

  const handleTriggerOnboarding = () => {
    // Clear onboarding state
    localStorage.removeItem('new-era-onboarding');
    // Reset and show
    resetOnboarding();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTriggerOnboarding}
      className="fixed bottom-4 right-4 z-50"
    >
      <HelpCircle className="h-4 w-4 mr-2" />
      Start Tour
    </Button>
  );
}