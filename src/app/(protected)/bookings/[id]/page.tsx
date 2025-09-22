import { notFound } from 'next/navigation'
import { QRCodeGenerator } from '@/components/bookings/qr-code-generator'
import { BookingApprovalButtons } from '@/components/bookings/booking-approval-buttons'
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
import { es } from 'date-fns/locale'
import { getBookingAction } from '@/lib/actions/booking'
import { getTenantContext } from '@/lib/auth'

interface BookingDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const resolvedParams = await params

  // Get current user context
  const { user } = await getTenantContext()
  const isAdmin = user?.role === 'COWORK_ADMIN' || user?.role === 'SUPER_ADMIN'

  // Fetch booking by ID using server action
  const result = await getBookingAction({ id: resolvedParams.id })

  if (!result.success || !result.data) {
    notFound()
  }

  const booking = result.data
  const space = booking.space

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

  const duration = differenceInMinutes(new Date(booking.endTime), new Date(booking.startTime))
  const totalDuration = duration
  const totalCost = booking.cost ? Number(booking.cost) : 0

  // Generate QR data
  const qrCodeData = JSON.stringify({
    bookingId: booking.id,
    spaceId: booking.spaceId,
    timestamp: Date.now(),
    type: 'space_access'
  })

  return (
    <div className="container max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Reservas
            </Button>
          </Link>
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
              ID de Reserva: {booking.id} • Creado {format(new Date(booking.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
            <Link href={`/bookings/${booking.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-1" />Editar Reserva
              </Button>
            </Link>
          )}
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
                      <div className="font-medium">{space?.name || 'Espacio no especificado'}</div>
                      <div className="text-sm text-muted-foreground">
                        {space?.floor && space?.zone ? `${space.floor} • ${space.zone}` : space?.type || 'Sin ubicación'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{booking.participants?.length || 0} participantes</div>
                      <div className="text-sm text-muted-foreground">
                        Capacidad: {space?.capacity || 0} personas
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(booking.startTime), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>

                  {totalCost > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">${totalCost.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(totalDuration)} @ ${space?.hourlyRate ? Number(space.hourlyRate).toFixed(2) : '0.00'}/hr
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
                    <h4 className="font-medium mb-2">Descripción</h4>
                    <p className="text-muted-foreground">{booking.description}</p>
                  </div>
                </>
              )}

              {/* Notes */}
              {(booking.notes || booking.specialRequests) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notas Adicionales</h4>
                    <p className="text-muted-foreground">{booking.notes || booking.specialRequests}</p>
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
                    <a href={`mailto:${booking.user?.email}`} className="text-sm text-blue-600 hover:underline">
                      {booking.user?.email || 'No disponible'}
                    </a>
                  </div>
                </div>

                {booking.user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Teléfono</div>
                      <a href={`tel:${booking.user.phone}`} className="text-sm text-blue-600 hover:underline">
                        {booking.user.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Usuario</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.user?.firstName} {booking.user?.lastName}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Section for Admins */}
          {isAdmin && space?.requiresApproval && booking.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  Aprobación Requerida
                </CardTitle>
                <CardDescription>
                  Esta reserva requiere aprobación administrativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingApprovalButtons booking={booking} />
              </CardContent>
            </Card>
          )}

          {/* Check-in History */}
          {booking.checkIns && booking.checkIns.length > 0 && (
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
                  {booking.checkIns.map((activity) => (
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
                            {activity.user?.firstName} {activity.user?.lastName}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(activity.checkInTime || activity.createdAt), "dd 'de' MMM, HH:mm", { locale: es })}
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
              booking={{
                ...booking,
                qrCodeData: qrCodeData
              }}
              showBookingDetails={false}
            />
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/spaces/${booking.spaceId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />Ver Detalles del Espacio
                </Button>
              </Link>

              <Link href="/check-in">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />Escáner de Acceso al Espacio
                </Button>
              </Link>

              <Link href={`/bookings/new?spaceId=${booking.spaceId}&start=${booking.startTime}&end=${booking.endTime}`}>
                <Button variant="outline" className="w-full justify-start">
                  <RotateCcw className="h-4 w-4 mr-2" />Reservar Nuevamente
                </Button>
              </Link>
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