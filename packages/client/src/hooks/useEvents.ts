import { useState, useEffect } from 'react'
import type { Event, ApiResponse } from '@catapult-event-manager/shared'
import api from '@/lib/api'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<ApiResponse<Event[]>>('/api/events')
      
      if (data.success && data.data) {
        setEvents(data.data)
      } else {
        setError(data.error || 'Failed to fetch events')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to server'
      setError(message)
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create a new event
  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const data = await api.post<ApiResponse<Event>>('/api/events', eventData)
      
      if (data.success && data.data) {
        setEvents([...events, data.data])
        return data.data
      } else {
        throw new Error(data.error || 'Failed to create event')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event'
      setError(message)
      throw err
    }
  }

  // Update an existing event
  const updateEvent = async (id: string, eventData: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setError(null)
      const data = await api.put<ApiResponse<Event>>(`/api/events/${id}`, eventData)
      
      if (data.success && data.data) {
        setEvents(events.map(e => e.id === id ? data.data! : e))
        return data.data
      } else {
        throw new Error(data.error || 'Failed to update event')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event'
      setError(message)
      throw err
    }
  }

  // Delete an event
  const deleteEvent = async (id: string) => {
    try {
      setError(null)
      const data = await api.delete<ApiResponse<void>>(`/api/events/${id}`)
      
      if (data.success) {
        setEvents(events.filter(e => e.id !== id))
      } else {
        throw new Error(data.error || 'Failed to delete event')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event'
      setError(message)
      throw err
    }
  }

  // Load events on mount
  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  }
}