'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  createSpaceSchema,
  updateSpaceSchema,
  type CreateSpaceRequest,
  type UpdateSpaceRequest,
} from '@/lib/validations/space'
import { createSpaceAction, updateSpaceAction } from '@/lib/actions/space'
import { getSpaceTypeOptionsAction, createDefaultSpaceTypesAction } from '@/lib/actions/space-type'
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Settings, DollarSign, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface SpaceFormProps {
  space?: any // Space from database
  isEdit?: boolean
}

export function SpaceForm({ space, isEdit = false }: SpaceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [spaceTypeOptions, setSpaceTypeOptions] = useState<Array<{ key: string; name: string }>>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const router = useRouter()

  const formSchema = isEdit ? updateSpaceSchema : createSpaceSchema
  const defaultValues = isEdit && space ? {
    name: space.name || '',
    description: space.description || '',
    type: space.type,
    capacity: space.capacity || 1,
    hourlyRate: space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : '',
    floor: space.floor || '',
    zone: space.zone || '',
    area: space.area ? parseFloat(space.area.toString()) : '',
    maxAdvanceBooking: space.maxAdvanceBooking || 30,
    minBookingDuration: space.minBookingDuration || 60,
    maxBookingDuration: space.maxBookingDuration || '',
    cancellationHours: space.cancellationHours || 24,
    requiresApproval: space.requiresApproval || false,
    allowRecurring: space.allowRecurring || true,
    isActive: space.isActive || true,
    images: space.images ? JSON.parse(space.images) : [],
  } : {
    name: '',
    description: '',
    type: 'MEETING_ROOM' as const,
    capacity: 1,
    hourlyRate: '',
    floor: '',
    zone: '',
    area: '',
    maxAdvanceBooking: 30,
    minBookingDuration: 60,
    maxBookingDuration: '',
    cancellationHours: 24,
    requiresApproval: false,
    allowRecurring: true,
    isActive: true,
    images: [],
  }

  const form = useForm<CreateSpaceRequest | UpdateSpaceRequest>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Fetch space type options
  useEffect(() => {
    const fetchSpaceTypes = async () => {
      try {
        setIsLoadingTypes(true)
        const result = await getSpaceTypeOptionsAction()
        if (result.success) {
          if (result.data.length === 0) {
            // No space types configured, try to create defaults
            const defaultResult = await createDefaultSpaceTypesAction({ overwrite: false })
            if (defaultResult.success) {
              // Retry fetching after creating defaults
              const retryResult = await getSpaceTypeOptionsAction()
              if (retryResult.success) {
                setSpaceTypeOptions(retryResult.data)
                toast.success('Tipos de espacio por defecto creados exitosamente')
              } else {
                toast.error('No hay tipos de espacio configurados. Contacta al administrador.')
              }
            } else {
              toast.error('No hay tipos de espacio configurados. Contacta al administrador para configurar tipos de espacio.')
            }
          } else {
            setSpaceTypeOptions(result.data)
          }
        } else {
          console.error('Error fetching space types:', result.error)
          toast.error('Error al cargar tipos de espacio')
        }
      } catch (error) {
        console.error('Error fetching space types:', error)
        toast.error('Error al cargar tipos de espacio')
      } finally {
        setIsLoadingTypes(false)
      }
    }

    fetchSpaceTypes()
  }, [])

  const onSubmit = async (data: CreateSpaceRequest | UpdateSpaceRequest) => {
    setIsLoading(true)
    try {
      const result = isEdit && space
        ? await updateSpaceAction({ ...data, id: space.id } as UpdateSpaceRequest)
        : await createSpaceAction(data as CreateSpaceRequest)

      if (result.success) {
        toast.success(isEdit ? 'Espacio actualizado exitosamente' : 'Espacio creado exitosamente')
        router.push('/spaces')
        router.refresh()
      } else {
        toast.error(result.error || 'Ocurrió un error')
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as any, { message })
          })
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Actualizar detalles y configuración del espacio' : 'Agregar un nuevo espacio a tu coworking'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Espacio</FormLabel>
                      <FormControl>
                        <Input placeholder="Sala de Conferencias A" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre descriptivo para este espacio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Espacio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTypes}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingTypes ? "Cargando tipos..." : "Seleccionar tipo de espacio"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaceTypeOptions.map((type) => (
                            <SelectItem key={type.key} value={type.key}>
                              {type.name}
                            </SelectItem>
                          ))}
                          {spaceTypeOptions.length === 0 && !isLoadingTypes && (
                            <SelectItem value="" disabled>
                              No hay tipos de espacio disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe este espacio, sus características y casos de uso ideales..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descripción opcional del espacio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo de personas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="25.5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormDescription>
                        Metros cuadrados
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormDescription>
                        Precio por hora
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalles de Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piso</FormLabel>
                      <FormControl>
                        <Input placeholder="Piso 1" {...field} />
                      </FormControl>
                      <FormDescription>
                        ¿En qué piso está este espacio?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona</FormLabel>
                      <FormControl>
                        <Input placeholder="Ala Este" {...field} />
                      </FormControl>
                      <FormDescription>
                        Área o zona dentro del edificio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuración de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxAdvanceBooking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserva Anticipada Máxima (días)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        ¿Con cuánta anticipación pueden reservar los usuarios?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cancellationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aviso de Cancelación (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="24"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                        />
                      </FormControl>
                      <FormDescription>
                        Horas mínimas antes de la cancelación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minBookingDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Mínima (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        />
                      </FormControl>
                      <FormDescription>
                        Duración mínima de reserva
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBookingDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración Máxima (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          placeholder="480"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormDescription>
                        Duración máxima de reserva (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Requiere Aprobación
                        </FormLabel>
                        <FormDescription>
                          Las reservas necesitan aprobación del administrador
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

                <FormField
                  control={form.control}
                  name="allowRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Permitir Recurrencia
                        </FormLabel>
                        <FormDescription>
                          Habilitar reservas recurrentes
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

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Activo
                        </FormLabel>
                        <FormDescription>
                          El espacio está disponible para reservar
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
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Espacio' : 'Crear Espacio')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}