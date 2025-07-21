import { useParams, useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { EventForm } from '@/components/events/EventForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { Event } from '@catapult-event-manager/shared'

export function EventEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, loading, error, updateEvent } = useEvents()
  
  const event = events.find(e => e.id === id)
  
  const handleSubmit = async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!event) return
    
    try {
      await updateEvent(event.id, data)
      navigate(`/events/${event.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update event')
    }
  }
  
  const handleCancel = () => {
    navigate(`/events/${id}`)
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
  
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-semibold">Event not found</div>
          <p className="text-muted-foreground mt-2">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <EventForm
          event={event}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  )
}