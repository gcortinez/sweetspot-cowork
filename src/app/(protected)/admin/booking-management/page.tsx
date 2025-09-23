import { Suspense } from 'react'
import { listBookingsAction } from '@/lib/actions/booking'
import { listSpacesAction } from '@/lib/actions/space'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { BookingApprovalButtons } from '@/components/bookings/booking-approval-buttons'
import { BookingEditDialog } from '@/components/admin/booking-edit-dialog'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
  Users,
  MapPin,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

async function BookingManagementContent() {
  // Fetch all bookings and spaces
  const [bookingsResult, spacesResult] = await Promise.all([
    listBookingsAction({
      page: 1,
      limit: 100,
      sortBy: 'startTime',
      sortOrder: 'desc',
    }),
    listSpacesAction({
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  ])

  const allBookings = bookingsResult.success ? (bookingsResult.data?.bookings || []) : []
  const spaces = spacesResult.success ? (spacesResult.data?.spaces || []) : []

  // Create space lookup for easy access
  const spaceMap = new Map(spaces.map(space => [space.id, space]))

  // Separate bookings by type for better organization
  const pendingApprovals = allBookings.filter(booking => {
    const space = spaceMap.get(booking.spaceId)
    return booking.status === 'PENDING' && space?.requiresApproval === true
  })

  const allOtherBookings = allBookings.filter(booking =>
    !(booking.status === 'PENDING' && spaceMap.get(booking.spaceId)?.requiresApproval === true)
  )

  // Stats calculation
  const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED')
  const checkedInBookings = allBookings.filter(b => b.status === 'CHECKED_IN')
  const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED')

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle,
        text: 'Pendiente'
      },
      'CONFIRMED': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'Confirmada'
      },
      'CHECKED_IN': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Users,
        text: 'En Curso'
      },
      'CHECKED_OUT': {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: CheckCircle,
        text: 'Completada'
      },
      'CANCELLED': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'Cancelada'
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const BookingCard = ({ booking }: { booking: any }) => {
    const space = spaceMap.get(booking.spaceId)
    const requiresApproval = space?.requiresApproval && booking.status === 'PENDING'

    return (
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {/* Title and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{booking.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{booking.user?.firstName} {booking.user?.lastName}</span>
                    <span>•</span>
                    <span>{booking.user?.email}</span>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              {/* Space and Time Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{space?.name || 'Espacio no encontrado'}</span>
                  {space?.color && (
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: space.color }}
                      title={`Color: ${space.color}`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatDate(booking.startTime)} • {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {booking.description && (
                <p className="text-sm text-muted-foreground">{booking.description}</p>
              )}

              {/* Admin Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Link href={`/bookings/${booking.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                </Link>

                {booking.status !== 'CANCELLED' && booking.status !== 'CHECKED_OUT' && (
                  <BookingEditDialog
                    booking={booking}
                    spaces={spaces}
                    onUpdate={() => {
                      // Refresh the page data after update
                      window.location.reload()
                    }}
                  />
                )}

                {requiresApproval && (
                  <div className="ml-auto">
                    <BookingApprovalButtons booking={booking} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Aprobación</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren acción inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Reservas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Curso</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{checkedInBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Actualmente en uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Busca y filtra reservas por diferentes criterios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por nombre/email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="CHECKED_IN">En Curso</SelectItem>
                  <SelectItem value="CHECKED_OUT">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Espacio</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los espacios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los espacios</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Section - Priority */}
      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Reservas Pendientes de Aprobación ({pendingApprovals.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Estas reservas requieren tu aprobación inmediata para confirmar la disponibilidad del espacio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Other Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Todas las Reservas ({allOtherBookings.length})
          </CardTitle>
          <CardDescription>
            Gestiona todas las reservas del cowork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allOtherBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay reservas para mostrar</p>
              </div>
            ) : (
              allOtherBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {pendingApprovals.length === 0 && allBookings.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Todas las Aprobaciones al Día
            </CardTitle>
            <CardDescription className="text-green-700">
              Excelente! No hay reservas pendientes de aprobación en este momento.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

function BookingManagementLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingManagementPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Gestión de Reservas
            </h1>
            <p className="text-muted-foreground">
              Administra, aprueba y gestiona todas las reservas del cowork
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/bookings/new">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<BookingManagementLoading />}>
        <BookingManagementContent />
      </Suspense>
    </div>
  )
}