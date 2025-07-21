import { Calendar, MapPin, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@catapult-event-manager/shared'
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add'

interface EventCardProps {
  event: Event
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function EventCard({ event, onView, onEdit, onDelete }: EventCardProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isQuickAdd = event.id === QUICK_ADD_EVENT_ID;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isQuickAdd ? 'border-green-600 bg-green-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          {isQuickAdd && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <Zap className="h-3 w-3 mr-1" />
              Quick Add
            </Badge>
          )}
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(event.date)}
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {event.location}
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              Capacity: {event.capacity}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={onView}>
            View
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}