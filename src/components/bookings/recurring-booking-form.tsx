'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Calendar, Clock, AlertCircle } from 'lucide-react'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

const recurringBookingSchema = z.object({
  enabled: z.boolean().default(false),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('WEEKLY'),
  interval: z.number().min(1).max(52).default(1),
  endType: z.enum(['NEVER', 'DATE', 'COUNT']).default('NEVER'),
  endDate: z.date().optional(),
  occurrences: z.number().min(1).max(365).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
})

type RecurringBookingFormData = z.infer<typeof recurringBookingSchema>

interface RecurringBookingFormProps {
  startDate: Date
  endDate: Date
  value?: RecurringBookingFormData
  onChange: (data: RecurringBookingFormData) => void
  className?: string
}

export function RecurringBookingForm({
  startDate,
  endDate,
  value,
  onChange,
  className,
}: RecurringBookingFormProps) {
  const [previewDates, setPreviewDates] = useState<Date[]>([])

  const form = useForm<RecurringBookingFormData>({
    resolver: zodResolver(recurringBookingSchema),
    defaultValues: value || {
      enabled: false,
      frequency: 'WEEKLY',
      interval: 1,
      endType: 'NEVER',
      daysOfWeek: [startDate.getDay()], // Default to the day of the week of startDate
    },
  })

  const watchedValues = form.watch()

  // Generate preview dates based on current settings
  const generatePreviewDates = (data: RecurringBookingFormData) => {
    if (!data.enabled) {
      setPreviewDates([])
      return
    }

    const dates: Date[] = [startDate]
    let currentDate = new Date(startDate)
    let count = 0
    const maxPreview = 10 // Limit preview to 10 dates

    while (count < maxPreview) {
      let nextDate: Date

      switch (data.frequency) {
        case 'DAILY':
          nextDate = addDays(currentDate, data.interval)
          break
        case 'WEEKLY':
          nextDate = addWeeks(currentDate, data.interval)
          break
        case 'MONTHLY':
          nextDate = addMonths(currentDate, data.interval)
          break
        default:
          return
      }

      // Check end conditions
      if (data.endType === 'DATE' && data.endDate && nextDate > data.endDate) {
        break
      }
      if (data.endType === 'COUNT' && data.occurrences && dates.length >= data.occurrences) {
        break
      }

      // For weekly frequency, check days of week
      if (data.frequency === 'WEEKLY' && data.daysOfWeek && data.daysOfWeek.length > 0) {
        if (data.daysOfWeek.includes(nextDate.getDay())) {
          dates.push(nextDate)
          count++
        }
      } else {
        dates.push(nextDate)
        count++
      }

      currentDate = nextDate
    }

    setPreviewDates(dates.slice(1)) // Exclude the first date (original booking)
  }

  // Update preview when form values change
  React.useEffect(() => {
    generatePreviewDates(watchedValues)
    onChange(watchedValues)
  }, [watchedValues, onChange])

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Reserva Recurrente
        </CardTitle>
        <CardDescription>
          Configurar reservas recurrentes para reuniones o eventos regulares
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Habilitar Reserva Recurrente</FormLabel>
                  <FormDescription>
                    Crear múltiples reservas basadas en un horario
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchedValues.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar frecuencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Diario</SelectItem>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                          <SelectItem value="MONTHLY">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cada {watchedValues.frequency === 'DAILY' ? 'días' :
                              watchedValues.frequency === 'WEEKLY' ? 'semanas' : 'meses'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Repetir cada {field.value} {watchedValues.frequency === 'DAILY' ? 'día(s)' :
                                                  watchedValues.frequency === 'WEEKLY' ? 'semana(s)' : 'mes(es)'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedValues.frequency === 'WEEKLY' && (
                <FormField
                  control={form.control}
                  name="daysOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días de la Semana</FormLabel>
                      <FormDescription>
                        Seleccionar qué días de la semana repetir la reserva
                      </FormDescription>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {dayNames.map((day, index) => (
                            <Badge
                              key={index}
                              variant={field.value?.includes(index) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const current = field.value || []
                                const updated = current.includes(index)
                                  ? current.filter(d => d !== index)
                                  : [...current, index]
                                field.onChange(updated)
                              }}
                            >
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="endType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición de Finalización</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar condición de finalización" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEVER">Nunca terminar</SelectItem>
                        <SelectItem value="DATE">Terminar en fecha</SelectItem>
                        <SelectItem value="COUNT">Terminar después de ocurrencias</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedValues.endType === 'DATE' && (
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Finalización</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        La última fecha cuando se deben crear reservas recurrentes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedValues.endType === 'COUNT' && (
                <FormField
                  control={form.control}
                  name="occurrences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Ocurrencias</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número total de reservas a crear (incluyendo la original)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {previewDates.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Vista Previa (Próximas {previewDates.length} fechas)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {previewDates.map((date, index) => (
                        <Badge key={index} variant="outline" className="justify-center p-2">
                          {format(date, 'MMM dd, yyyy')}
                        </Badge>
                      ))}
                    </div>
                    {previewDates.length >= 10 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>Mostrando las primeras 10 fechas. Se crearán más basadas en tu configuración.</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Form>
      </CardContent>
    </Card>
  )
}