'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Building
} from 'lucide-react'
import { approveBookingAction } from '@/lib/actions/booking'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface BookingApprovalListProps {
  bookings: any[]
  spaces: any[]
}

export function BookingApprovalList({ bookings, spaces }: BookingApprovalListProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const handleApproval = async (bookingId: string, approved: boolean, notes?: string) => {
    setIsProcessing(bookingId)

    try {
      const result = await approveBookingAction({
        id: bookingId,
        approved,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success(
          approved
            ? 'Reserva aprobada exitosamente'
            : 'Reserva rechazada exitosamente'
        )

        // Refresh the page to update the list
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al procesar la aprobación')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Error al procesar la solicitud')
    } finally {
      setIsProcessing(null)
      setSelectedBookingId(null)
      setRejectionNotes('')
    }
  }

  const getSpaceInfo = (spaceId: string) => {
    return spaces.find(s => s.id === spaceId)
  }

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })
  }

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const durationMs = endDate.getTime() - startDate.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours === 0) {
      return `${minutes} min`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Sin Reservas Pendientes
          </CardTitle>
          <CardDescription>
            No hay reservas esperando aprobación en este momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Todas las reservas están al día. Las nuevas solicitudes aparecerán aquí automáticamente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reservas Pendientes de Aprobación
        </CardTitle>
        <CardDescription>
          {bookings.length} reserva{bookings.length !== 1 ? 's' : ''} esperando tu decisión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => {
            const space = getSpaceInfo(booking.spaceId)
            const isProcessingThis = isProcessing === booking.id

            return (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Space Color Indicator */}
                  <div
                    className="w-4 h-16 rounded-full flex-shrink-0"
                    style={{ backgroundColor: space?.color || '#3b82f6' }}
                  />

                  <div className="flex-1 space-y-3">
                    {/* Booking Title & User */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{booking.user?.firstName} {booking.user?.lastName}</span>
                          <span>•</span>
                          <span>{booking.user?.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    </div>

                    {/* Space & Time Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{space?.name || 'Espacio no encontrado'}</span>
                        {space?.capacity && (
                          <>
                            <span>•</span>
                            <span className="text-muted-foreground">
                              Capacidad: {space.capacity} personas
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(booking.startTime)}</span>
                      </div>
                    </div>

                    {/* Duration & Description */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Duración: {getDuration(booking.startTime, booking.endTime)}</span>
                        {booking.cost && (
                          <>
                            <span>•</span>
                            <span className="text-muted-foreground">
                              Costo: ${Number(booking.cost).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>

                      {booking.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {booking.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  {/* Approve Button */}
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isProcessingThis}
                    onClick={() => handleApproval(booking.id, true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isProcessingThis ? 'Procesando...' : 'Aprobar'}
                  </Button>

                  {/* Reject Button with Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isProcessingThis}
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rechazar Reserva</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que quieres rechazar esta reserva?
                          Puedes agregar una nota explicando el motivo.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{booking.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {space?.name} • {formatDateTime(booking.startTime)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="rejection-notes" className="text-sm font-medium">
                            Motivo del rechazo (opcional)
                          </label>
                          <Textarea
                            id="rejection-notes"
                            placeholder="Explica el motivo del rechazo..."
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedBookingId(null)
                            setRejectionNotes('')
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={isProcessingThis}
                          onClick={() => handleApproval(booking.id, false, rejectionNotes)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {isProcessingThis ? 'Procesando...' : 'Rechazar Reserva'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}