'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Switch } from '@/components/ui/switch'
import { Settings, DollarSign, Clock, Shield, Edit, Palette } from 'lucide-react'
import { ColorPaletteSelector } from '@/components/spaces/forms/color-palette-selector'
import { updateSpaceAction } from '@/lib/actions/space'
import { getSpaceTypeOptionsAction, createDefaultSpaceTypesAction } from '@/lib/actions/space-type'

interface Space {
  id: string
  name: string
  type: string
  description?: string
  capacity: number
  floor?: string
  zone?: string
  area?: number
  hourlyRate?: number
  minBookingDuration?: number
  maxBookingDuration?: number
  maxAdvanceBooking?: number
  cancellationHours?: number
  isActive: boolean
  requiresApproval: boolean
  allowRecurring: boolean
  color?: string
}

interface EditSpaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  space: Space | null
  onSuccess?: () => void
}

export function EditSpaceModal({ open, onOpenChange, space, onSuccess }: EditSpaceModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [spaceTypes, setSpaceTypes] = useState<Array<{ key: string; name: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    capacity: '',
    floor: '',
    zone: '',
    area: '',
    hourlyRate: '',
    minBookingDuration: '60',
    maxBookingDuration: '',
    maxAdvanceBooking: '30',
    cancellationHours: '24',
    isActive: true,
    requiresApproval: false,
    allowRecurring: true,
    color: '',
  })

  // Load space types when modal opens
  useEffect(() => {
    if (open) {
      loadSpaceTypes()
    }
  }, [open])

  // Initialize form data when space changes
  useEffect(() => {
    if (space) {
      setFormData({
        name: space.name || '',
        type: space.type || '',
        description: space.description || '',
        capacity: space.capacity?.toString() || '',
        floor: space.floor || '',
        zone: space.zone || '',
        area: space.area?.toString() || '',
        hourlyRate: space.hourlyRate?.toString() || '',
        minBookingDuration: space.minBookingDuration?.toString() || '60',
        maxBookingDuration: space.maxBookingDuration?.toString() || '',
        maxAdvanceBooking: space.maxAdvanceBooking?.toString() || '30',
        cancellationHours: space.cancellationHours?.toString() || '24',
        isActive: space.isActive ?? true,
        requiresApproval: space.requiresApproval ?? false,
        allowRecurring: space.allowRecurring ?? true,
        color: space.color || '',
      })
    }
  }, [space])

  const loadSpaceTypes = async () => {
    try {
      const result = await getSpaceTypeOptionsAction()
      if (result.success) {
        let types = result.data

        // If no space types exist, create defaults
        if (types.length === 0) {
          const defaultResult = await createDefaultSpaceTypesAction({ overwrite: false })
          if (defaultResult.success) {
            const retryResult = await getSpaceTypeOptionsAction()
            if (retryResult.success) {
              types = retryResult.data
            }
          }
        }
        setSpaceTypes(types)
      }
    } catch (error) {
      console.error('Error loading space types:', error)
      toast.error('Error al cargar tipos de espacio')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space?.id) return

    setIsLoading(true)

    try {
      const result = await updateSpaceAction({
        id: space.id,
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        capacity: parseInt(formData.capacity),
        floor: formData.floor || undefined,
        zone: formData.zone || undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        minBookingDuration: parseInt(formData.minBookingDuration),
        maxBookingDuration: formData.maxBookingDuration ? parseInt(formData.maxBookingDuration) : undefined,
        maxAdvanceBooking: parseInt(formData.maxAdvanceBooking),
        cancellationHours: parseInt(formData.cancellationHours),
        isActive: formData.isActive,
        requiresApproval: formData.requiresApproval,
        allowRecurring: formData.allowRecurring,
        color: formData.color || undefined,
      })

      if (result.success) {
        toast.success('Espacio actualizado exitosamente')
        onOpenChange(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.error || 'Error al actualizar el espacio')
      }
    } catch (error) {
      console.error('Update space error:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!space) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Espacio - {space.name}
          </DialogTitle>
          <DialogDescription>
            Actualiza la información del espacio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nombre del Espacio *
                  </label>
                  <Input
                    id="name"
                    placeholder="Sala de Reuniones A"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Tipo de Espacio *
                  </label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceTypes.map((type) => (
                        <SelectItem key={type.key} value={type.key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </label>
                <Textarea
                  id="description"
                  placeholder="Descripción del espacio..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="capacity" className="text-sm font-medium">
                    Capacidad (personas) *
                  </label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="floor" className="text-sm font-medium">
                    Piso
                  </label>
                  <Input
                    id="floor"
                    placeholder="Piso 1"
                    value={formData.floor}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="zone" className="text-sm font-medium">
                    Zona
                  </label>
                  <Input
                    id="zone"
                    placeholder="Zona Norte"
                    value={formData.zone}
                    onChange={(e) => handleInputChange('zone', e.target.value)}
                  />
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
                <ColorPaletteSelector
                  defaultValue={formData.color}
                  onColorChange={(color) => handleInputChange('color', color)}
                  inputId="edit-space-color"
                />
                <p className="text-xs text-muted-foreground">
                  Este color se usará para identificar las reservas de este espacio en el calendario
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios y Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="area" className="text-sm font-medium">
                    Área (m²)
                  </label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="25.5"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="hourlyRate" className="text-sm font-medium">
                    Tarifa por Hora (USD)
                  </label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="25.00"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="minBookingDuration" className="text-sm font-medium">
                    Duración Mínima (minutos) *
                  </label>
                  <Input
                    id="minBookingDuration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.minBookingDuration}
                    onChange={(e) => handleInputChange('minBookingDuration', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxBookingDuration" className="text-sm font-medium">
                    Duración Máxima (minutos)
                  </label>
                  <Input
                    id="maxBookingDuration"
                    type="number"
                    min="15"
                    step="15"
                    placeholder="480"
                    value={formData.maxBookingDuration}
                    onChange={(e) => handleInputChange('maxBookingDuration', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="maxAdvanceBooking" className="text-sm font-medium">
                    Reserva Anticipada (días) *
                  </label>
                  <Input
                    id="maxAdvanceBooking"
                    type="number"
                    min="1"
                    value={formData.maxAdvanceBooking}
                    onChange={(e) => handleInputChange('maxAdvanceBooking', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cancellationHours" className="text-sm font-medium">
                    Cancelación (horas antes) *
                  </label>
                  <Input
                    id="cancellationHours"
                    type="number"
                    min="0"
                    value={formData.cancellationHours}
                    onChange={(e) => handleInputChange('cancellationHours', e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Espacio Activo</label>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios pueden ver y reservar este espacio
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Requiere Aprobación</label>
                    <p className="text-sm text-muted-foreground">
                      Las reservas necesitan aprobación manual
                    </p>
                  </div>
                  <Switch
                    checked={formData.requiresApproval}
                    onCheckedChange={(checked) => handleInputChange('requiresApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Permitir Reservas Recurrentes</label>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios pueden hacer reservas repetitivas
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowRecurring}
                    onCheckedChange={(checked) => handleInputChange('allowRecurring', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}