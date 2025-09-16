import { notFound } from 'next/navigation'
import { QRCodeGenerator } from '@/components/bookings/qr-code-generator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Mail,
  Phone,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { format, differenceInMinutes } from 'date-fns'

interface BookingDetailPageProps {
  params: {
    id: string
  }
}

// Mock booking data - in real implementation, this would come from server actions
const mockBooking = {
  id: 'booking-1',
  title: 'Team Weekly Meeting',
  description: 'Weekly team sync and project updates. We will discuss current progress, blockers, and next steps.',
  spaceId: 'space-1',
  spaceName: 'Conference Room A',
  spaceType: 'MEETING_ROOM',
  spaceCapacity: 15,
  spaceFloor: '2nd Floor',
  spaceZone: 'East Wing',
  startDateTime: '2024-01-15T09:00:00',
  endDateTime: '2024-01-15T11:00:00',
  attendeeCount: 8,
  contactEmail: 'john.doe@company.com',
  contactPhone: '+1 (555) 123-4567',
  status: 'CONFIRMED' as const,
  setupTime: 15,
  cleanupTime: 10,
  hourlyRate: 50,
  notes: 'Please ensure the projector is set up and tested before the meeting.',
  createdAt: '2024-01-10T10:30:00',
  updatedAt: '2024-01-12T14:20:00',
  qrCodeData: JSON.stringify({
    bookingId: 'booking-1',
    spaceId: 'space-1',
    timestamp: Date.now(),
    type: 'space_access'
  }),
  checkInHistory: [
    {
      id: '1',
      action: 'CHECK_IN' as const,
      timestamp: '2024-01-15T09:05:00',
      userName: 'John Doe'
    },
    {
      id: '2',
      action: 'CHECK_OUT' as const,
      timestamp: '2024-01-15T10:58:00',
      userName: 'John Doe'
    }
  ]
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  // In real implementation, fetch booking by ID using server action
  // const result = await getBookingAction({ id: params.id })

  // Mock data usage
  const booking = mockBooking
  if (!booking) {
    notFound()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'PENDING':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const duration = differenceInMinutes(new Date(booking.endDateTime), new Date(booking.startDateTime))
  const totalDuration = duration + (booking.setupTime || 0) + (booking.cleanupTime || 0)
  const totalCost = booking.hourlyRate ? (totalDuration / 60) * booking.hourlyRate : 0

  return (
    <div className="container max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a Reservas
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {booking.title}
              <div className="flex items-center gap-2">
                {getStatusIcon(booking.status)}
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
            </h1>
            <p className="text-muted-foreground">
              ID de Reserva: {booking.id} • Creado {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/bookings/${booking.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Editar Reserva
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles de la Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Space Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{booking.spaceName}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.spaceFloor} • {booking.spaceZone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{booking.attendeeCount} attendees</div>
                      <div className="text-sm text-muted-foreground">
                        Capacity: {booking.spaceCapacity} people
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(booking.startDateTime), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.startDateTime), 'HH:mm')} - {format(new Date(booking.endDateTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>

                  {totalCost > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">${totalCost.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(totalDuration)} @ ${booking.hourlyRate}/hr
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {booking.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{booking.description}</p>
                  </div>
                </>
              )}

              {/* Setup/Cleanup Times */}
              {(booking.setupTime || booking.cleanupTime) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {booking.setupTime && (
                      <div>
                        <h4 className="font-medium mb-1">Setup Time</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(booking.setupTime)} before the meeting
                        </p>
                      </div>
                    )}
                    {booking.cleanupTime && (
                      <div>
                        <h4 className="font-medium mb-1">Cleanup Time</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(booking.cleanupTime)} after the meeting
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              {booking.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Additional Notes</h4>
                    <p className="text-muted-foreground">{booking.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Correo</div>
                    <a href={`mailto:${booking.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                      {booking.contactEmail}
                    </a>
                  </div>
                </div>

                {booking.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Teléfono</div>
                      <a href={`tel:${booking.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                        {booking.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Check-in History */}
          {booking.checkInHistory && booking.checkInHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Historial de Acceso
                </CardTitle>
                <CardDescription>
                  Actividad reciente de entrada y salida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.checkInHistory.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.action === 'CHECK_IN'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.action === 'CHECK_IN' ? '↓' : '↑'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {activity.action === 'CHECK_IN' ? 'Registró Entrada' : 'Registró Salida'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.userName}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {booking.status === 'CONFIRMED' && (
            <QRCodeGenerator
              booking={booking}
              showBookingDetails={false}
              onRegenerateQR={() => {
                // In real implementation, call server action to regenerate QR
                console.log('Regenerating QR code...')
              }}
            />
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/spaces/${booking.spaceId}`}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Detalles del Espacio
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/check-in">
                  <Calendar className="h-4 w-4 mr-2" />
                  Escáner de Acceso al Espacio
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/bookings/new?spaceId=${booking.spaceId}&start=${booking.startDateTime}&end=${booking.endDateTime}`}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reservar Nuevamente
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-medium">{formatDuration(duration)}</span>
                </div>
                {booking.setupTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preparación</span>
                    <span className="font-medium">{formatDuration(booking.setupTime)}</span>
                  </div>
                )}
                {booking.cleanupTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limpieza</span>
                    <span className="font-medium">{formatDuration(booking.cleanupTime)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Tiempo Total</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
                {totalCost > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Costo Total</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}