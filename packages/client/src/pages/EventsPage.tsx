import { useNavigate } from 'react-router-dom'
import type { Event } from '@catapult-event-manager/shared'
import { EventList } from '@/components/events/EventList'
import { useEvents } from '@/hooks/useEvents'
import { Loader2 } from 'lucide-react'

export function EventsPage() {
  const navigate = useNavigate()
  const { events, loading, error, deleteEvent } = useEvents()

  const handleCreateEvent = () => {
    navigate('/events/new')
  }

  const handleViewEvent = (event: Event) => {
    navigate(`/events/${event.id}`)
  }

  const handleEditEvent = (event: Event) => {
    navigate(`/events/${event.id}/edit`)
  }

  const handleDeleteEvent = async (event: Event) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await deleteEvent(event.id)
      } catch (err) {
        alert('Failed to delete event')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">Error</div>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <EventList
      events={events}
      onViewEvent={handleViewEvent}
      onEditEvent={handleEditEvent}
      onDeleteEvent={handleDeleteEvent}
      onCreateEvent={handleCreateEvent}
    />
  )
}