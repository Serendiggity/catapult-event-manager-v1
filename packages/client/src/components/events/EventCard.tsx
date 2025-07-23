import { Calendar, MapPin, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@new-era-event-manager/shared'
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
    <Card 
      className={`hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${isQuickAdd ? 'border-green-600 bg-green-50/50' : ''}`}
      tabIndex={-1}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl line-clamp-2">{event.title}</CardTitle>
          {isQuickAdd && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 shrink-0">
              <Zap className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Quick Add</span>
            </Badge>
          )}
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2 mt-1">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <MapPin className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>Capacity: {event.capacity}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onView}
            className="flex-1 sm:flex-initial"
          >
            View
          </Button>
          {!isQuickAdd && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onEdit}
                className="flex-1 sm:flex-initial"
              >
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onDelete}
                className="flex-1 sm:flex-initial"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}