// Example of how to integrate onboarding into your components

import React from 'react';
import { Button } from '../ui/button';
import { Plus, Users, Mail } from 'lucide-react';
import { FeatureTooltip } from './FeatureTooltip';

// Example 1: Add data-onboarding attributes to elements for spotlight targeting
export function EventsPageExample() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        
        {/* Add data-onboarding attribute for targeting */}
        <Button data-onboarding="create-event-button">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* More components... */}
    </div>
  );
}

// Example 2: Use FeatureTooltip for progressive feature discovery
export function LeadsPageExample() {
  return (
    <div className="p-6">
      <div className="flex gap-4">
        {/* Feature tooltip on first use */}
        <FeatureTooltip
          id="bulk-actions"
          title="Bulk Actions Available"
          description="Select multiple leads to perform actions like adding to groups or sending campaigns."
        >
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Select All
          </Button>
        </FeatureTooltip>

        {/* Another feature discovery */}
        <FeatureTooltip
          id="quick-campaign"
          title="Quick Campaign"
          description="Send a campaign to selected leads with our AI-powered email assistant."
          delay={2000} // Show after 2 seconds
        >
          <Button 
            variant="outline"
            data-onboarding="quick-campaign-button"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Selected
          </Button>
        </FeatureTooltip>
      </div>
    </div>
  );
}

// Example 3: Add onboarding targets to key sections
export function LeadGroupsExample() {
  return (
    <div 
      className="border rounded-lg p-4"
      data-onboarding="lead-groups-section"
    >
      <h3 className="font-semibold mb-3">Lead Groups</h3>
      <div className="space-y-2">
        {/* Group items... */}
      </div>
      
      {/* Add create button with onboarding attribute */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mt-3 w-full"
        data-onboarding="create-group-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Group
      </Button>
    </div>
  );
}

// Example 4: Integration in App.tsx or main layout
import { OnboardingProvider } from './OnboardingProvider';
import { HelpMenu } from './HelpMenu';

export function AppLayoutExample() {
  return (
    <OnboardingProvider>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b">
          <div className="container flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">New Era</h1>
            
            {/* Help menu in header */}
            <HelpMenu />
          </div>
        </header>

        {/* Main content */}
        <main className="container py-6">
          {/* Your app routes/content */}
        </main>
      </div>
    </OnboardingProvider>
  );
}