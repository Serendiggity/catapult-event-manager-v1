import React, { useState } from 'react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

export function SimpleOnboarding() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Welcome to New Era! 🚀</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="mb-4">
          Turn business cards into meaningful connections. Let's get you started!
        </p>
        
        <div className="flex gap-2">
          <Button onClick={() => setIsVisible(false)}>
            Get Started
          </Button>
          <Button variant="outline" onClick={() => setIsVisible(false)}>
            Skip Tour
          </Button>
        </div>
      </div>
    </div>
  );
}