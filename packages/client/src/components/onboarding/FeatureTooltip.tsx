import React, { useState, useEffect } from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  id: string; // Unique ID for tracking dismissal
  title: string;
  description: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showOnce?: boolean; // Only show once per user
  delay?: number; // Delay before showing (ms)
  className?: string;
}

export function FeatureTooltip({
  id,
  title,
  description,
  children,
  side = 'top',
  showOnce = true,
  delay = 1000,
  className
}: FeatureTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissedKey = `feature-tooltip-${id}-dismissed`;
    if (showOnce && localStorage.getItem(dismissedKey)) {
      setIsDismissed(true);
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, showOnce, delay]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    
    if (showOnce) {
      localStorage.setItem(`feature-tooltip-${id}-dismissed`, 'true');
    }
  };

  if (isDismissed) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn(
            "max-w-xs p-4 animate-in fade-in slide-in-from-bottom-2",
            className
          )}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="font-semibold text-sm">{title}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 -mt-1 -mr-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}