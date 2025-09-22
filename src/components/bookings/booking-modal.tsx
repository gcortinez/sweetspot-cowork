'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, Users, MapPin, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createBookingAction } from '@/lib/actions/booking'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/clerk-auth-context'

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaces: any[]
  selectedSpaceId?: string
  selectedDate?: Date
  selectedStartTime?: string
  selectedEndTime?: string
}

export function BookingModal({
  open,
  onOpenChange,
  spaces,
  selectedSpaceId,
  selectedDate = new Date(),
  selectedStartTime,
  selectedEndTime,
}: BookingModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    spaceId: selectedSpaceId || '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: selectedStartTime || '09:00',
    endTime: selectedEndTime || '10:00',
    title: '',
    description: '',
    attendees: 1,
    isRecurring: false,
    requiresApproval: false,
  })

  // Update form data when props change
  React.useEffect(() => {
    console.log('BookingModal - Props received:', {
      open,
      selectedSpaceId,
      selectedDate,
      selectedStartTime,
      selectedEndTime
    })

    if (open) {
      const newFormData = {
        spaceId: selectedSpaceId || '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedStartTime || '09:00',
        endTime: selectedEndTime || '10:00',
        title: '',
        description: '',
        attendees: 1, // Always start with 1 attendee
        isRecurring: false,
        requiresApproval: false,
      }

      console.log('BookingModal - Setting form data:', newFormData)
      setFormData(newFormData)
    }
  }, [open, selectedSpaceId, selectedDate, selectedStartTime, selectedEndTime])

  const selectedSpace = spaces.find(s => s.id === formData.spaceId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('BookingModal - Submit triggered with formData:', formData)

    // Validations
    if (!formData.spaceId) {
      console.log('BookingModal - No spaceId, showing error')
      toast.error('Por favor selecciona un espacio')
      return
    }

    // Check if spaceId is valid (CUID format)
    if (formData.spaceId.length < 20 || !/^[a-z0-9]+$/i.test(formData.spaceId)) {
      console.log('BookingModal - Invalid spaceId format:', formData.spaceId)
      toast.error('ID de espacio inválido. Por favor selecciona un espacio válido.')
      return
    }

    if (!user) {
      console.log('BookingModal - No user available')
      toast.error('No se pudo identificar el usuario. Por favor inicia sesión nuevamente.')
      return
    }

    console.log('BookingModal - Starting booking creation...')
    console.log('BookingModal - Current user:', user)
    console.log('BookingModal - FormData spaceId:', formData.spaceId)
    console.log('BookingModal - User ID for clientId:', user?.id)
    console.log('BookingModal - User clientId:', user?.clientId)

    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      // Validate dates
      if (isNaN(startDateTime.getTime())) {
        toast.error('Fecha y hora de inicio inválidas')
        setLoading(false)
        return
      }

      if (isNaN(endDateTime.getTime())) {
        toast.error('Fecha y hora de fin inválidas')
        setLoading(false)
        return
      }

      if (endDateTime <= startDateTime) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio')
        setLoading(false)
        return
      }

      // Get the database user ID from the API
      let databaseUserId = user?.clientId;

      if (!databaseUserId) {
        console.log('BookingModal - No clientId found, fetching from API...')
        try {
          const userResponse = await fetch('/api/auth/current-user')
          const userData = await userResponse.json()
          console.log('BookingModal - User data from API:', userData)
          databaseUserId = userData.user?.id
        } catch (error) {
          console.error('BookingModal - Error fetching user ID:', error)
          toast.error('Error al obtener información del usuario')
          setLoading(false)
          return
        }
      }

      if (!databaseUserId) {
        console.log('BookingModal - No database user ID found')
        toast.error('No se pudo obtener el ID del usuario')
        setLoading(false)
        return
      }

      const bookingData = {
        spaceId: formData.spaceId,
        userId: databaseUserId, // Use database user ID as userId
        startTime: startDateTime,
        endTime: endDateTime,
        title: formData.title || `Reserva de ${selectedSpace?.name}`,
        description: formData.description,
        metadata: {
          attendees: formData.attendees,
        },
      }

      console.log('BookingModal - Calling createBookingAction with:', bookingData)
      const result = await createBookingAction(bookingData)
      console.log('BookingModal - createBookingAction result:', result)

      if (result.success) {
        console.log('BookingModal - Booking created successfully')
        toast.success('Reserva creada exitosamente')
        onOpenChange(false)
        router.refresh()
      } else {
        console.log('BookingModal - Booking creation failed:', result.error)
        toast.error(result.error || 'Error al crear la reserva')
      }
    } catch (error) {
      console.error('BookingModal - Error creating booking:', error)
      toast.error('Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nueva Reserva
          </DialogTitle>
          <DialogDescription>
            Complete los detalles para crear una nueva reserva de espacio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Space Selection */}
          <div className="space-y-2">
            <Label htmlFor="space">Espacio *</Label>
            <Select
              value={formData.spaceId}
              onValueChange={(value) => {
                console.log('BookingModal - Space selected:', value)
                const space = spaces.find(s => s.id === value)
                console.log('BookingModal - Space object found:', space)
                setFormData(prev => ({
                  ...prev,
                  spaceId: value,
                  requiresApproval: space?.requiresApproval || false,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un espacio" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{space.name}</span>
                      <span className="text-muted-foreground">
                        (Capacidad: {space.capacity})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Inicio *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Fin *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Reserva</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Reunión de equipo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales de la reserva"
              rows={3}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">Número de Asistentes</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="attendees"
                type="number"
                min="1"
                max={selectedSpace?.capacity || 100}
                value={formData.attendees || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, attendees: parseInt(e.target.value) || 1 }))}
                className="pl-10"
              />
            </div>
            {selectedSpace && formData.attendees > selectedSpace.capacity && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Excede la capacidad máxima del espacio
              </p>
            )}
          </div>

          {/* Space Info */}
          {selectedSpace && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Información del Espacio</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Capacidad:</span>{' '}
                  {selectedSpace.capacity} personas
                </div>
                <div>
                  <span className="text-muted-foreground">Tarifa:</span>{' '}
                  ${selectedSpace.hourlyRate}/hora
                </div>
                {selectedSpace.floor && (
                  <div>
                    <span className="text-muted-foreground">Piso:</span>{' '}
                    {selectedSpace.floor}
                  </div>
                )}
                {selectedSpace.requiresApproval && (
                  <div className="col-span-2">
                    <span className="text-warning flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Este espacio requiere aprobación
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (selectedSpace && formData.attendees > selectedSpace.capacity)}
            >
              {loading ? 'Creando...' : 'Crear Reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}