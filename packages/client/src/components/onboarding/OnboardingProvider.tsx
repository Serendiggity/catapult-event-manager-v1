import React, { useEffect } from 'react';
import { OnboardingFlow } from './OnboardingFlow';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useLocation } from 'react-router-dom';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const location = useLocation();
  const { isVisible, hasCompletedOnboarding, showOnboarding } = useOnboardingStore();

  // Show onboarding on first visit
  useEffect(() => {
    if (!hasCompletedOnboarding && location.pathname === '/') {
      // Auto-show onboarding for new users on homepage
      const timer = setTimeout(() => {
        showOnboarding();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, location.pathname, showOnboarding]);

  return (
    <>
      {children}
      {isVisible && <OnboardingFlow />}
    </>
  );
}