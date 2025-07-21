import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Event } from '@catapult-event-manager/shared'

interface EventFormProps {
  event?: Event
  onSubmit: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

interface FormErrors {
  title?: string
  date?: string
  capacity?: string
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    capacity: event?.capacity?.toString() || ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required'
    } else {
      const selectedDate = new Date(formData.date)
      if (isNaN(selectedDate.getTime())) {
        newErrors.date = 'Please enter a valid date'
      }
    }
    
    if (formData.capacity && (parseInt(formData.capacity) < 1 || isNaN(parseInt(formData.capacity)))) {
      newErrors.capacity = 'Capacity must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      title: true,
      date: true,
      capacity: true
    })
    
    if (!validateForm()) {
      return
    }
    
    onSubmit({
      title: formData.title,
      description: formData.description || null,
      location: formData.location || null,
      date: new Date(formData.date),
      capacity: formData.capacity ? parseInt(formData.capacity) : null
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className={errors.title && touched.title ? 'text-destructive' : ''}>
          Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value })
            if (touched.title) validateForm()
          }}
          onBlur={() => handleBlur('title')}
          className={errors.title && touched.title ? 'border-destructive' : ''}
          aria-invalid={errors.title && touched.title}
          aria-describedby={errors.title && touched.title ? 'title-error' : undefined}
        />
        {errors.title && touched.title && (
          <p id="title-error" className="text-sm text-destructive mt-1">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="date" className={errors.date && touched.date ? 'text-destructive' : ''}>
          Date & Time *
        </Label>
        <Input
          id="date"
          type="datetime-local"
          value={formData.date}
          onChange={(e) => {
            setFormData({ ...formData, date: e.target.value })
            if (touched.date) validateForm()
          }}
          onBlur={() => handleBlur('date')}
          className={errors.date && touched.date ? 'border-destructive' : ''}
          aria-invalid={errors.date && touched.date}
          aria-describedby={errors.date && touched.date ? 'date-error' : undefined}
        />
        {errors.date && touched.date && (
          <p id="date-error" className="text-sm text-destructive mt-1">
            {errors.date}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="capacity" className={errors.capacity && touched.capacity ? 'text-destructive' : ''}>
          Capacity
        </Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={(e) => {
            setFormData({ ...formData, capacity: e.target.value })
            if (touched.capacity) validateForm()
          }}
          onBlur={() => handleBlur('capacity')}
          min="1"
          className={errors.capacity && touched.capacity ? 'border-destructive' : ''}
          aria-invalid={errors.capacity && touched.capacity}
          aria-describedby={errors.capacity && touched.capacity ? 'capacity-error' : undefined}
        />
        {errors.capacity && touched.capacity && (
          <p id="capacity-error" className="text-sm text-destructive mt-1">
            {errors.capacity}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {event ? 'Update Event' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}