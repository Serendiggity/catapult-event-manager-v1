import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  // Current step index
  currentStep: number;
  
  // Completed step IDs
  completedSteps: string[];
  
  // Visibility state
  isVisible: boolean;
  
  // Whether user has completed onboarding
  hasCompletedOnboarding: boolean;
  
  // Actions
  setCurrentStep: (step: number) => void;
  completeStep: (stepId: string) => void;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  resetOnboarding: () => void;
  skipToStep: (stepId: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      completedSteps: [],
      isVisible: false,
      hasCompletedOnboarding: false,

      setCurrentStep: (step) => set({ currentStep: step }),

      completeStep: (stepId) => 
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId]
        })),

      showOnboarding: () => set({ isVisible: true }),

      hideOnboarding: () => 
        set({ 
          isVisible: false, 
          hasCompletedOnboarding: true 
        }),

      resetOnboarding: () => 
        set({
          currentStep: 0,
          completedSteps: [],
          isVisible: true,
          hasCompletedOnboarding: false
        }),

      skipToStep: (stepId) => {
        // This would need access to the steps array
        // For now, we'll just set visibility
        set({ isVisible: true });
      }
    }),
    {
      name: 'new-era-onboarding',
      partialize: (state) => ({
        completedSteps: state.completedSteps,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);