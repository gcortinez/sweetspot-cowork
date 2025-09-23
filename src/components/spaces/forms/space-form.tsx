import { createSpaceFormAction, updateSpaceFormAction } from '@/lib/actions/space'
import { getSpaceTypeOptionsAction, createDefaultSpaceTypesAction } from '@/lib/actions/space-type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Settings, DollarSign, Clock, Shield, Palette } from 'lucide-react'
import Link from 'next/link'
import { ColorPaletteSelector } from './color-palette-selector'

interface SpaceFormProps {
  space?: any // Space from database for editing
  isEdit?: boolean
}

export async function SpaceForm({ space, isEdit = false }: SpaceFormProps) {
  // Load space types using Server Action
  let spaceTypes: Array<{ key: string; name: string }> = []

  try {
    const result = await getSpaceTypeOptionsAction()
    if (result.success) {
      spaceTypes = result.data

      // If no space types exist, create defaults
      if (spaceTypes.length === 0) {
        const defaultResult = await createDefaultSpaceTypesAction({ overwrite: false })
        if (defaultResult.success) {
          const retryResult = await getSpaceTypeOptionsAction()
          if (retryResult.success) {
            spaceTypes = retryResult.data
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading space types:', error)
  }

  // Create Server Action for this specific form
  const formAction = isEdit && space
    ? updateSpaceFormAction.bind(null, space.id)
    : createSpaceFormAction

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/spaces">
            <Button variant="ghost" size="sm">← Volver a Espacios</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Editar Espacio' : 'Crear Nuevo Espacio'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Actualizar información del espacio' : 'Agregar un nuevo espacio a tu cowork'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-8">
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
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre del Espacio *
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Sala de Reuniones A"
                  defaultValue={space?.name || ''}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nombre descriptivo que verán los usuarios
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Tipo de Espacio *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  defaultValue={space?.type || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar tipo</option>
                  {spaceTypes.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Categoría del espacio
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe las características y funcionalidades de este espacio..."
                defaultValue={space?.description || ''}
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Descripción detallada del espacio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="capacity" className="text-sm font-medium">
                  Capacidad *
                </label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="8"
                  defaultValue={space?.capacity || ''}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Número máximo de personas
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="floor" className="text-sm font-medium">
                  Piso
                </label>
                <Input
                  id="floor"
                  name="floor"
                  placeholder="Piso 2"
                  defaultValue={space?.floor || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Ubicación por piso
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="zone" className="text-sm font-medium">
                  Zona
                </label>
                <Input
                  id="zone"
                  name="zone"
                  placeholder="Zona Norte"
                  defaultValue={space?.zone || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Área específica del cowork
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color del Espacio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium">
                Color para el Calendario
              </label>
              <ColorPaletteSelector defaultValue={space?.color} />
              <p className="text-xs text-muted-foreground">
                Este color se usará para identificar las reservas de este espacio en el calendario
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración de Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="hourlyRate" className="text-sm font-medium">
                  Tarifa por Hora
                </label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  defaultValue={space?.hourlyRate ? Number(space.hourlyRate) : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Precio en USD por hora de uso
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="area" className="text-sm font-medium">
                  Área (m²)
                </label>
                <Input
                  id="area"
                  name="area"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="25.5"
                  defaultValue={space?.area ? Number(space.area) : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Área en metros cuadrados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reglas de Reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="minBookingDuration" className="text-sm font-medium">
                  Duración Mínima (minutos)
                </label>
                <Input
                  id="minBookingDuration"
                  name="minBookingDuration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="60"
                  defaultValue={space?.minBookingDuration || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Tiempo mínimo de reserva
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="maxBookingDuration" className="text-sm font-medium">
                  Duración Máxima (minutos)
                </label>
                <Input
                  id="maxBookingDuration"
                  name="maxBookingDuration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="480"
                  defaultValue={space?.maxBookingDuration || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Tiempo máximo por reserva
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="maxAdvanceBooking" className="text-sm font-medium">
                  Reserva Anticipada (días)
                </label>
                <Input
                  id="maxAdvanceBooking"
                  name="maxAdvanceBooking"
                  type="number"
                  min="1"
                  placeholder="30"
                  defaultValue={space?.maxAdvanceBooking || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Días máximos de anticipación
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="cancellationHours" className="text-sm font-medium">
                  Cancelación (horas)
                </label>
                <Input
                  id="cancellationHours"
                  name="cancellationHours"
                  type="number"
                  min="0"
                  placeholder="24"
                  defaultValue={space?.cancellationHours || ''}
                />
                <p className="text-xs text-muted-foreground">
                  Horas mínimas para cancelar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Acceso y Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={space?.isActive ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Espacio Activo
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Disponible para reservas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  name="requiresApproval"
                  defaultChecked={space?.requiresApproval ?? false}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="requiresApproval" className="text-sm font-medium">
                    Requiere Aprobación
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Admin debe aprobar reservas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowRecurring"
                  name="allowRecurring"
                  defaultChecked={space?.allowRecurring ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="allowRecurring" className="text-sm font-medium">
                    Permitir Recurrencia
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Reservas repetitivas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/spaces">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit">
            {isEdit ? 'Actualizar Espacio' : 'Crear Espacio'}
          </Button>
        </div>
      </form>
    </div>
  )
}