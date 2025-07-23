import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  PlayCircle, 
  BookOpen, 
  MessageSquare,
  Keyboard,
  RefreshCw
} from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useNavigate } from 'react-router-dom';

interface HelpMenuProps {
  className?: string;
}

export function HelpMenu({ className }: HelpMenuProps) {
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboardingStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleRestartTour = () => {
    resetOnboarding();
    setIsOpen(false);
    // Navigate to dashboard to start from beginning
    navigate('/');
  };

  const shortcuts = [
    { key: 'Ctrl+K', description: 'Quick search' },
    { key: 'Ctrl+N', description: 'New event' },
    { key: 'Ctrl+L', description: 'Add lead' },
    { key: 'Ctrl+/', description: 'Show shortcuts' },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Help menu"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Help & Resources</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleRestartTour}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Restart Onboarding Tour
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.open('/docs', '_blank')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Documentation
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.open('/support', '_blank')}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Support
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs">Keyboard Shortcuts</DropdownMenuLabel>
        
        {shortcuts.map(({ key, description }) => (
          <DropdownMenuItem key={key} className="text-xs justify-between">
            <span className="text-muted-foreground">{description}</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              {key.split('+').map((k, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-xs">+</span>}
                  {k}
                </span>
              ))}
            </kbd>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-destructive"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset All Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}