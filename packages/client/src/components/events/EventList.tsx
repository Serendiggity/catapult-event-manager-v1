import type { Event } from '@catapult-event-manager/shared'
import { EventCard } from './EventCard'
import { Button } from '@/components/ui/button'
import { Plus, Users, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add'

interface EventListProps {
  events: Event[]
  onViewEvent: (event: Event) => void
  onEditEvent: (event: Event) => void
  onDeleteEvent: (event: Event) => void
  onCreateEvent: () => void
}

export function EventList({ 
  events, 
  onViewEvent, 
  onEditEvent, 
  onDeleteEvent,
  onCreateEvent 
}: EventListProps) {
  const navigate = useNavigate();
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first event to get started
        </p>
        <Button onClick={onCreateEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Events</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/contacts')}>
            <Users className="mr-2 h-4 w-4" />
            All Leads
          </Button>
          <Button variant="outline" onClick={() => navigate('/lead-groups')}>
            <Users className="mr-2 h-4 w-4" />
            All Lead Groups
          </Button>
          <Button variant="outline" onClick={() => navigate('/campaigns')}>
            <Mail className="mr-2 h-4 w-4" />
            All Campaigns
          </Button>
          <Button onClick={onCreateEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sort events to show Quick Add first */}
        {events
          .sort((a, b) => {
            if (a.id === QUICK_ADD_EVENT_ID) return -1;
            if (b.id === QUICK_ADD_EVENT_ID) return 1;
            return 0;
          })
          .map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onView={() => onViewEvent(event)}
              onEdit={() => onEditEvent(event)}
              onDelete={() => onDeleteEvent(event)}
            />
          ))}
      </div>
    </div>
  )
}