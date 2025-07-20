import { useState, useEffect } from 'react'
import type { Event, ApiResponse } from '@catapult-event-manager/shared'

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(API_BASE_URL)
      const data: ApiResponse<Event[]> = await response.json()
      
      if (data.success && data.data) {
        setEvents(data.data)
      } else {
        setError(data.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create a new event
  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
      const data: ApiResponse<Event> = await response.json()
      
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
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
      const data: ApiResponse<Event> = await response.json()
      
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
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })
      const data: ApiResponse<void> = await response.json()
      
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