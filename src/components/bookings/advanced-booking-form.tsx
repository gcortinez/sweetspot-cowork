'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RecurringBookingForm } from './recurring-booking-form'
import { Calendar, Clock, Users, MapPin, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react'
import { format, differenceInMinutes, parseISO } from 'date-fns'
import { toast } from 'sonner'

const bookingSchema = z.object({
  spaceId: z.string().min(1, 'Por favor selecciona un espacio'),
  title: z.string().min(1, 'El título es requerido').max(100, 'El título debe tener menos de 100 caracteres'),
  description: z.string().optional(),
  startDateTime: z.string().min(1, 'La fecha y hora de inicio es requerida'),
  endDateTime: z.string().min(1, 'La fecha y hora de fin es requerida'),
  attendeeCount: z.number().min(1, 'Se requiere al menos 1 asistente').max(1000, 'Demasiados asistentes'),
  contactEmail: z.string().email('Por favor ingresa una dirección de email válida'),
  contactPhone: z.string().optional(),
  setupTime: z.number().min(0).max(120).default(0),
  cleanupTime: z.number().min(0).max(120).default(0),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface Space {
  id: string
  name: string
  type: string
  capacity: number
  hourlyRate?: number
  floor?: string
  zone?: string
  minBookingDuration: number
  maxBookingDuration?: number
  requiresApproval: boolean
  isActive: boolean
}

interface Conflict {
  id: string
  title: string
  start: string
  end: string
  status: string
}

interface AdvancedBookingFormProps {
  spaces: Space[]
  selectedSpaceId?: string
  defaultStartTime?: string
  defaultEndTime?: string
  onSubmit?: (data: BookingFormData & { recurring?: any }) => void
  isEdit?: boolean
  initialData?: Partial<BookingFormData>
}

export function AdvancedBookingForm({
  spaces,
  selectedSpaceId,
  defaultStartTime,
  defaultEndTime,
  onSubmit,
  isEdit = false,
  initialData,
}: AdvancedBookingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recurringData, setRecurringData] = useState<any>(null)
  const router = useRouter()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      spaceId: selectedSpaceId || '',
      title: '',
      description: '',
      startDateTime: defaultStartTime || '',
      endDateTime: defaultEndTime || '',
      attendeeCount: 1,
      contactEmail: '',
      contactPhone: '',
      setupTime: 0,
      cleanupTime: 0,
      notes: '',
      ...initialData,
    },
  })

  const watchedValues = form.watch()

  // Update selected space when spaceId changes
  useEffect(() => {
    const space = spaces.find(s => s.id === watchedValues.spaceId)
    setSelectedSpace(space || null)
  }, [watchedValues.spaceId, spaces])

  // Calculate duration and cost
  useEffect(() => {
    if (watchedValues.startDateTime && watchedValues.endDateTime) {
      const start = parseISO(watchedValues.startDateTime)
      const end = parseISO(watchedValues.endDateTime)
      const durationMinutes = differenceInMinutes(end, start)
      setDuration(durationMinutes)

      if (selectedSpace?.hourlyRate) {
        const hours = durationMinutes / 60
        const setupHours = (watchedValues.setupTime || 0) / 60
        const cleanupHours = (watchedValues.cleanupTime || 0) / 60
        const totalHours = hours + setupHours + cleanupHours
        setTotalCost(totalHours * selectedSpace.hourlyRate)
      } else {
        setTotalCost(0)
      }
    }
  }, [watchedValues.startDateTime, watchedValues.endDateTime, watchedValues.setupTime, watchedValues.cleanupTime, selectedSpace])

  // Check for conflicts (simulate API call)
  useEffect(() => {
    if (watchedValues.spaceId && watchedValues.startDateTime && watchedValues.endDateTime) {
      // Simulate conflict checking
      // In real implementation, this would be an API call
      setConflicts([])
    }
  }, [watchedValues.spaceId, watchedValues.startDateTime, watchedValues.endDateTime])

  const handleSubmit = async (data: BookingFormData) => {
    setIsLoading(true)
    try {
      // Validate duration
      if (selectedSpace) {
        const durationMinutes = differenceInMinutes(parseISO(data.endDateTime), parseISO(data.startDateTime))

        if (durationMinutes < selectedSpace.minBookingDuration) {
          form.setError('endDateTime', {
            message: `La duración mínima de reserva es ${selectedSpace.minBookingDuration} minutos`
          })
          return
        }

        if (selectedSpace.maxBookingDuration && durationMinutes > selectedSpace.maxBookingDuration) {
          form.setError('endDateTime', {
            message: `La duración máxima de reserva es ${selectedSpace.maxBookingDuration} minutos`
          })
          return
        }

        if (data.attendeeCount > selectedSpace.capacity) {
          form.setError('attendeeCount', {
            message: `La capacidad del espacio es ${selectedSpace.capacity} personas`
          })
          return
        }
      }

      if (onSubmit) {
        await onSubmit({ ...data, recurring: recurringData })
      }

      toast.success(isEdit ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente')

      if (!isEdit) {
        form.reset()
        setRecurringData(null)
      }
    } catch (error) {
      console.error('Booking submission error:', error)
      toast.error('Ocurrió un error al procesar tu reserva')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles de la Reserva
              </CardTitle>
              <CardDescription>
                Ingresa la información básica para tu reserva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="spaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar un espacio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces.filter(space => space.isActive).map((space) => (
                            <SelectItem key={space.id} value={space.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{space.name}</span>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge variant="outline" className="text-xs">
                                    {space.type.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {space.capacity} personas
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título de la reunión" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles adicionales sobre tu reserva..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora de Inicio</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora de Fin</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="setupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo de Preparación (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Tiempo adicional antes del evento</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cleanupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo de Limpieza (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Tiempo adicional después del evento</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Asistentes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration and Cost Summary */}
              {duration > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Duración</div>
                      <div className="text-sm text-muted-foreground">{formatDuration(duration)}</div>
                    </div>
                  </div>
                  {selectedSpace?.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Costo Total</div>
                        <div className="text-sm text-muted-foreground">
                          ${totalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedSpace && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Capacidad</div>
                        <div className="text-sm text-muted-foreground">
                          {watchedValues.attendeeCount} / {selectedSpace.capacity} personas
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contacto@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono de Contacto (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Requisitos especiales, instrucciones de configuración, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Recurring Booking */}
          {watchedValues.startDateTime && watchedValues.endDateTime && !isEdit && (
            <RecurringBookingForm
              startDate={parseISO(watchedValues.startDateTime)}
              endDate={parseISO(watchedValues.endDateTime)}
              value={recurringData}
              onChange={setRecurringData}
            />
          )}

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Conflictos de Horario Detectados</div>
                  <div className="space-y-1">
                    {conflicts.map((conflict) => (
                      <div key={conflict.id} className="text-sm">
                        {conflict.title} ({format(parseISO(conflict.start), 'MMM dd, HH:mm')} - {format(parseISO(conflict.end), 'HH:mm')})
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Space Requirements */}
          {selectedSpace && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Requisitos del Espacio</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Duración Mín: {formatDuration(selectedSpace.minBookingDuration)}</div>
                    {selectedSpace.maxBookingDuration && (
                      <div>Duración Máx: {formatDuration(selectedSpace.maxBookingDuration)}</div>
                    )}
                    <div>Capacidad: {selectedSpace.capacity} personas</div>
                    {selectedSpace.requiresApproval && (
                      <div className="text-amber-600">Requiere Aprobación</div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || conflicts.length > 0}>
              {isLoading ? 'Procesando...' : isEdit ? 'Actualizar Reserva' : 'Crear Reserva'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}