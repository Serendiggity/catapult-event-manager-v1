import { useParams, useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { EventDetails } from '@/components/events/EventDetails'
import { Loader2 } from 'lucide-react'

export function EventDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, loading, error, updateEvent, deleteEvent } = useEvents()
  
  const event = events.find(e => e.id === id)
  
  const handleEdit = () => {
    navigate(`/events/${id}/edit`)
  }
  
  const handleDelete = async () => {
    if (!event) return
    
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await deleteEvent(event.id)
        navigate('/events')
      } catch (err) {
        alert('Failed to delete event')
      }
    }
  }
  
  const handleBack = () => {
    navigate('/events')
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
    <EventDetails
      event={event}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  )
}