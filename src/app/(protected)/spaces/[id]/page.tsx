import { notFound } from 'next/navigation'
import { getSpaceAction } from '@/lib/actions/space'
import { SpaceCardEnhanced } from '@/components/spaces/space-card-enhanced'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Settings,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Shield,
  RotateCcw,
  Palette,
} from 'lucide-react'
import Link from 'next/link'

interface SpaceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { id } = await params
  const result = await getSpaceAction({ id })

  if (!result.success || !result.data) {
    notFound()
  }

  const space = result.data

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Gratuito'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} horas ${remainingMinutes} minutos` : `${hours} horas`
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/spaces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Espacios
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {space.name}
              <Badge variant={space.isActive ? 'default' : 'secondary'}>
                {space.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {formatSpaceType(space.type)} • Creado {new Date(space.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/spaces/${space.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-1" />Editar Espacio
            </Button>
          </Link>
          <Link href={`/bookings/new?spaceId=${space.id}`}>
            <Button>
              <Calendar className="h-4 w-4 mr-1" />Reservar Espacio
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Space Card Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa del Espacio</CardTitle>
              <CardDescription>Cómo aparece este espacio a los usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <SpaceCardEnhanced space={space} showActions={false} />
            </CardContent>
          </Card>

          {/* Description */}
          {space.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{space.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Booking Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Reglas y Configuración de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Límites de Duración
                  </div>
                  <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                    <div>Mínimo: {formatDuration(space.minBookingDuration)}</div>
                    {space.maxBookingDuration && (
                      <div>Máximo: {formatDuration(space.maxBookingDuration)}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Reserva Anticipada
                  </div>
                  <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                    <div>Hasta {space.maxAdvanceBooking} días de anticipación</div>
                    <div>Cancelar {space.cancellationHours}h antes del inicio</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {space.requiresApproval && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Requiere Aprobación
                  </Badge>
                )}
                {space.allowRecurring && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Reservas Recurrentes Permitidas
                  </Badge>
                )}
                {!space.requiresApproval && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Reserva Instantánea
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Capacidad</span>
                </div>
                <span className="font-medium">{space.capacity} personas</span>
              </div>

              {space.area && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Área</span>
                  </div>
                  <span className="font-medium">{space.area} m²</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tarifa por Hora</span>
                </div>
                <span className="font-medium">{formatCurrency(space.hourlyRate)}</span>
              </div>

              {space.color && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Color del Calendario</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: space.color }}
                      title={`Color: ${space.color}`}
                    />
                    <span className="font-medium text-xs text-muted-foreground">{space.color}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creado</span>
                  <span>{new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Última Actualización</span>
                  <span>{new Date(space.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {space.floor && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Piso</span>
                  <span>{space.floor}</span>
                </div>
              )}
              {space.zone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zona</span>
                  <span>{space.zone}</span>
                </div>
              )}
              {!space.floor && !space.zone && (
                <p className="text-sm text-muted-foreground">No hay detalles de ubicación disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/spaces/${space.id}/availability`}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />Gestionar Disponibilidad
                </Button>
              </Link>
              <Link href={`/bookings?spaceId=${space.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />Ver Reservas
                </Button>
              </Link>
              <Link href={`/spaces/${space.id}/analytics`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />Analíticas
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}