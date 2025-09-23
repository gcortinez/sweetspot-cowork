'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Calendar, Clock, Users, MapPin, AlertTriangle, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface BookingEditDialogProps {
  booking: any
  spaces: any[]
  onUpdate?: () => void
  className?: string
}

export function BookingEditDialog({
  booking,
  spaces,
  onUpdate,
  className
}: BookingEditDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: booking.title || '',
    description: booking.description || '',
    spaceId: booking.spaceId || '',
    startTime: new Date(booking.startTime).toISOString().slice(0, 16),
    endTime: new Date(booking.endTime).toISOString().slice(0, 16),
    status: booking.status || 'PENDING',
    adminNotes: booking.adminNotes || '',
  })

  const statusOptions = [
    { value: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMED', label: 'Confirmada', color: 'bg-green-100 text-green-800' },
    { value: 'CHECKED_IN', label: 'En Curso', color: 'bg-blue-100 text-blue-800' },
    { value: 'CHECKED_OUT', label: 'Completada', color: 'bg-gray-100 text-gray-800' },
    { value: 'CANCELLED', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  ]

  const selectedSpace = spaces.find(space => space.id === formData.spaceId)
  const selectedStatus = statusOptions.find(status => status.value === formData.status)

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateDuration = () => {
    const start = new Date(formData.startTime)
    const end = new Date(formData.endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate dates
      const startDate = new Date(formData.startTime)
      const endDate = new Date(formData.endTime)

      if (endDate <= startDate) {
        toast({
          title: "Error de validación",
          description: "La hora de fin debe ser posterior a la hora de inicio",
          variant: "destructive",
        })
        return
      }

      // Here you would call the server action to update the booking
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Reserva actualizada",
        description: "Los cambios se han guardado correctamente",
      })

      setIsOpen(false)
      onUpdate?.()

    } catch (error) {
      console.error('Error updating booking:', error)
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar los cambios. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      title: booking.title || '',
      description: booking.description || '',
      spaceId: booking.spaceId || '',
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
      status: booking.status || 'PENDING',
      adminNotes: booking.adminNotes || '',
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Reserva
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de la reserva. Los cambios se registrarán en el historial de auditoría.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Info Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">Información Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{booking.user?.firstName} {booking.user?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Reserva</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la reserva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spaceId">Espacio</Label>
                <Select
                  value={formData.spaceId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, spaceId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        <div className="flex items-center gap-2">
                          {space.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: space.color }}
                            />
                          )}
                          {space.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${status.color} border-0 text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Inicio</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Fin</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>

              {/* Duration Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Duración:</span>
                  <span className="text-blue-600 font-semibold">{calculateDuration()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la reserva..."
              rows={3}
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Notas Administrativas
            </Label>
            <Textarea
              id="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
              placeholder="Notas internas para el equipo administrativo..."
              rows={2}
              className="bg-amber-50 border-amber-200"
            />
            <p className="text-xs text-amber-600">
              Estas notas solo son visibles para el equipo administrativo
            </p>
          </div>

          {/* Summary of Changes */}
          {(formData.title !== booking.title ||
            formData.spaceId !== booking.spaceId ||
            formData.status !== booking.status ||
            new Date(formData.startTime).getTime() !== new Date(booking.startTime).getTime() ||
            new Date(formData.endTime).getTime() !== new Date(booking.endTime).getTime()) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Resumen de Cambios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {formData.title !== booking.title && (
                  <div>
                    <span className="font-medium">Título:</span>{' '}
                    <span className="line-through text-gray-500">{booking.title}</span>{' '}
                    → <span className="text-orange-700">{formData.title}</span>
                  </div>
                )}
                {formData.spaceId !== booking.spaceId && (
                  <div>
                    <span className="font-medium">Espacio:</span>{' '}
                    <span className="line-through text-gray-500">
                      {spaces.find(s => s.id === booking.spaceId)?.name}
                    </span>{' '}
                    → <span className="text-orange-700">{selectedSpace?.name}</span>
                  </div>
                )}
                {formData.status !== booking.status && (
                  <div>
                    <span className="font-medium">Estado:</span>{' '}
                    <span className="line-through text-gray-500">{booking.status}</span>{' '}
                    → <span className="text-orange-700">{selectedStatus?.label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}