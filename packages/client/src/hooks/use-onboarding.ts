import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboarding-store';

interface UseOnboardingOptions {
  // Force show onboarding even if completed
  force?: boolean;
  // Only show on specific routes
  routes?: string[];
  // Delay before showing (ms)
  delay?: number;
}

export function useOnboarding(options: UseOnboardingOptions = {}) {
  const location = useLocation();
  const {
    isVisible,
    hasCompletedOnboarding,
    showOnboarding,
    resetOnboarding,
  } = useOnboardingStore();

  useEffect(() => {
    // Check if we should show onboarding
    const shouldShow = () => {
      // If forcing, always show
      if (options.force) return true;
      
      // If already completed, don't show
      if (hasCompletedOnboarding) return false;
      
      // If routes specified, only show on those routes
      if (options.routes && !options.routes.includes(location.pathname)) {
        return false;
      }
      
      // Check if user is new (no events, leads, or campaigns)
      const isNewUser = checkIfNewUser();
      
      return isNewUser;
    };

    if (shouldShow()) {
      const timer = setTimeout(() => {
        if (options.force) {
          resetOnboarding();
        } else {
          showOnboarding();
        }
      }, options.delay || 500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, hasCompletedOnboarding, options, showOnboarding, resetOnboarding]);

  return {
    isVisible,
    showOnboarding,
    resetOnboarding,
  };
}

// Helper to check if user is new
function checkIfNewUser(): boolean {
  // Check localStorage for any saved data
  const hasEvents = localStorage.getItem('new-era-events');
  const hasLeads = localStorage.getItem('new-era-leads');
  const hasCampaigns = localStorage.getItem('new-era-campaigns');
  
  // If any data exists, user is not new
  if (hasEvents || hasLeads || hasCampaigns) {
    return false;
  }
  
  // Check if onboarding was previously dismissed
  const onboardingDismissed = localStorage.getItem('onboarding-dismissed');
  if (onboardingDismissed) {
    return false;
  }
  
  return true;
}