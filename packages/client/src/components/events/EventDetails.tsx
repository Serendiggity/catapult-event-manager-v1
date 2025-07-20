import { Calendar, MapPin, Users, Clock, UserPlus, ClipboardCheck, UsersRound, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import type { Event } from '@catapult-event-manager/shared'

interface EventDetailsProps {
  event: Event
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

export function EventDetails({ event, onEdit, onDelete, onBack }: EventDetailsProps) {
  const navigate = useNavigate()
  
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

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="outline" onClick={onBack} className="mb-4">
        ← Back to Events
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{event.title}</CardTitle>
          {event.description && (
            <CardDescription className="text-lg mt-2">
              {event.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-lg">
              <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
              <span>{formatDate(event.date)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center text-lg">
                <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.capacity && (
              <div className="flex items-center text-lg">
                <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Capacity: {event.capacity} attendees</span>
              </div>
            )}
            
            <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Created: {formatDateTime(event.createdAt)}
              </div>
              {event.updatedAt && event.updatedAt !== event.createdAt && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Last updated: {formatDateTime(event.updatedAt)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-6">
            <Button onClick={onEdit}>Edit Event</Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/events/${event.id}/contacts/new`)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/events/${event.id}/lead-groups`)}
            >
              <UsersRound className="mr-2 h-4 w-4" />
              Lead Groups
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/events/${event.id}/campaigns`)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Campaigns
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/events/${event.id}/review`)}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Review Queue
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}