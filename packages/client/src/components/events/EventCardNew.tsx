import { Link } from 'react-router-dom';
import { Users, CheckCircle, Clock } from 'lucide-react';
import type { Event } from '@new-era-event-manager/shared';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  event: Event & { 
    totalLeads?: number;
    verifiedLeads?: number;
    pendingLeads?: number;
  };
}

// Simple geometric pattern
const GeometricPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-muted to-transparent opacity-50" />
    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-muted/20 blur-2xl" />
    <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-muted/20 blur-2xl" />
  </div>
);

export function EventCardNew({ event }: EventCardProps) {
  const totalLeads = event.totalLeads ?? 0;
  const verifiedLeads = event.verifiedLeads ?? 0;
  const pendingLeads = event.pendingLeads ?? 0;
  const verificationPercentage = totalLeads > 0 ? Math.round((verifiedLeads / totalLeads) * 100) : 0;
  
  // Get first letter of event title for visual
  const eventLetter = event.title.charAt(0).toUpperCase();
  
  // Format date
  const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return (
    <Link to={`/events/${event.id}`} className="block relative animate-fade-up">
      {/* Event Card with Image Overhang */}
      <div className="bg-card rounded-2xl p-6 pt-36 relative mt-10 transition-transform hover:-translate-y-1 cursor-pointer shadow-sm hover:shadow-md">
        {/* Overhang Image Container */}
        <div className="absolute -top-10 left-4 right-4 h-40 bg-muted dark:bg-muted/40 rounded-2xl overflow-hidden flex items-center justify-center pointer-events-none">
          <GeometricPattern />
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-card px-3 py-1.5 rounded-lg text-xs font-semibold">
            {eventDate}
          </div>
          
          {/* Brand Badge */}
          <div className="absolute top-4 right-4 w-8 h-8 bg-card rounded-full flex items-center justify-center text-xs font-bold">
            NE
          </div>
          
          {/* Event Visual */}
          <div className="relative text-7xl font-bold text-muted-foreground/50 opacity-30 mix-blend-multiply dark:mix-blend-screen">
            {eventLetter}
          </div>
        </div>
        
        {/* Card Content */}
        <h3 className="text-xl font-semibold mb-2 line-clamp-1">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
          {event.description || 'No description available'}
        </p>
        
        {/* Stats */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Total leads
            </div>
            <div className="text-lg font-semibold">{totalLeads}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-600" />
              Verified
            </div>
            <div className="text-lg font-semibold">{verifiedLeads}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              Pending
            </div>
            <div className="text-lg font-semibold">{pendingLeads}</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-green-700 dark:bg-green-600 rounded-full transition-all duration-500"
              style={{ width: `${verificationPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{verificationPercentage}% verified</p>
        </div>
        
        {/* Action Button */}
        <Button className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
          Open event
        </Button>
      </div>
    </Link>
  );
}