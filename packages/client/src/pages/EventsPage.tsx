import { useState } from 'react'
import type { Event } from '@catapult-event-manager/shared'
import { EventList } from '@/components/events/EventList'
import { EventForm } from '@/components/events/EventForm'
import { EventDetails } from '@/components/events/EventDetails'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents } from '@/hooks/useEvents'

type ViewMode = 'list' | 'create' | 'edit' | 'details'

export function EventsPage() {
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleCreateEvent = () => {
    setViewMode('create')
    setSelectedEvent(null)
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setViewMode('details')
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setViewMode('edit')
  }

  const handleDeleteEvent = async (event: Event) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await deleteEvent(event.id)
        if (viewMode === 'details' || viewMode === 'edit') {
          setViewMode('list')
          setSelectedEvent(null)
        }
      } catch (err) {
        alert('Failed to delete event')
      }
    }
  }

  const handleSubmitEvent = async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (viewMode === 'create') {
        await createEvent(data)
      } else if (viewMode === 'edit' && selectedEvent) {
        await updateEvent(selectedEvent.id, data)
      }
      setViewMode('list')
      setSelectedEvent(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save event')
    }
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedEvent(null)
  }

  if (viewMode === 'details' && selectedEvent) {
    return (
      <EventDetails
        event={selectedEvent}
        onEdit={() => handleEditEvent(selectedEvent)}
        onDelete={() => handleDeleteEvent(selectedEvent)}
        onBack={() => setViewMode('list')}
      />
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {viewMode === 'create' ? 'Create New Event' : 'Edit Event'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            event={viewMode === 'edit' ? selectedEvent || undefined : undefined}
            onSubmit={handleSubmitEvent}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading events...</div>
        </div>
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