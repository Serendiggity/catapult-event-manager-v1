import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { EventForm } from '@/components/events/EventForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Event } from '@catapult-event-manager/shared'

export function EventCreatePage() {
  const navigate = useNavigate()
  const { createEvent } = useEvents()
  
  const handleSubmit = async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createEvent(data)
      navigate('/events')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create event')
    }
  }
  
  const handleCancel = () => {
    navigate('/events')
  }
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <EventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  )
}