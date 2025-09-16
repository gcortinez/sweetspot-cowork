import { Suspense } from 'react'
import { listSpacesAction } from '@/lib/actions/space'
import { BookingCalendar } from '@/components/bookings/booking-calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, Plus, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

interface CalendarPageProps {
  searchParams: {
    spaceId?: string
    view?: 'month' | 'week' | 'day'
  }
}

// Mock bookings data - in real implementation, this would come from server actions
const mockBookings = [
  {
    id: '1',
    title: 'Team Meeting',
    start: '2024-01-15T09:00:00',
    end: '2024-01-15T11:00:00',
    spaceId: 'space-1',
    spaceName: 'Conference Room A',
    status: 'CONFIRMED' as const,
    attendeeCount: 8,
    isRecurring: false,
  },
  {
    id: '2',
    title: 'Weekly Standup',
    start: '2024-01-16T10:00:00',
    end: '2024-01-16T11:00:00',
    spaceId: 'space-2',
    spaceName: 'Meeting Room B',
    status: 'CONFIRMED' as const,
    attendeeCount: 5,
    isRecurring: true,
  },
  {
    id: '3',
    title: 'Client Presentation',
    start: '2024-01-17T14:00:00',
    end: '2024-01-17T16:00:00',
    spaceId: 'space-1',
    spaceName: 'Conference Room A',
    status: 'PENDING' as const,
    attendeeCount: 12,
    isRecurring: false,
  },
  {
    id: '4',
    title: 'Board Meeting',
    start: '2024-01-18T15:00:00',
    end: '2024-01-18T17:00:00',
    spaceId: 'space-3',
    spaceName: 'Executive Boardroom',
    status: 'CONFIRMED' as const,
    attendeeCount: 10,
    isRecurring: false,
  },
]

async function CalendarContent({ selectedSpaceId, view }: { selectedSpaceId?: string, view?: string }) {
  const result = await listSpacesAction({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al Cargar Calendario</CardTitle>
          <CardDescription>
            {result.error || 'No se puede cargar el calendario de reservas en este momento'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { data: spaces } = result.data
  const activeSpaces = spaces?.filter(space => space.isActive) || []

  // Filter bookings by selected space if specified
  const bookings = selectedSpaceId
    ? mockBookings.filter(booking => booking.spaceId === selectedSpaceId)
    : mockBookings

  const selectedSpace = selectedSpaceId ? activeSpaces.find(s => s.id === selectedSpaceId) : null

  return (
    <div className="space-y-6">
      {/* Space Selector and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendario de Reservas
                {selectedSpace && (
                  <Badge variant="outline">
                    {selectedSpace.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedSpace
                  ? `Mostrando reservas para ${selectedSpace.name}`
                  : `Mostrando todas las reservas en ${activeSpaces.length} espacios`
                }
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select defaultValue={selectedSpaceId || 'all'}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Espacios</SelectItem>
                  {activeSpaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      <div className="flex items-center gap-2">
                        <span>{space.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {space.capacity} personas
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button asChild>
                <Link href="/bookings/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Reserva
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <BookingCalendar
        bookings={bookings}
        spaces={activeSpaces}
        selectedSpaceId={selectedSpaceId}
        onBookingSelect={(booking) => {
          // Navigate to booking details
          console.log('Selected booking:', booking)
          // In real implementation: router.push(`/bookings/${booking.id}`)
        }}
        onDateSelect={(start, end, spaceId) => {
          // Navigate to create booking with pre-filled data
          const params = new URLSearchParams({
            start: start.toISOString(),
            end: end.toISOString(),
            ...(spaceId && { spaceId }),
          })
          window.location.href = `/bookings/new?${params.toString()}`
        }}
        onEventDrop={(bookingId, newStart, newEnd) => {
          // Handle booking rescheduling
          console.log('Reschedule booking:', bookingId, newStart, newEnd)
          // In real implementation: call rescheduling server action
        }}
        view={view as any || 'week'}
        height="700px"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedSpace ? selectedSpace.name : 'All Spaces'}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Próximas reservas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Asistentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.reduce((sum, booking) => sum + (booking.attendeeCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Participantes esperados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Recurrentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.isRecurring).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reservas que se repiten
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
    </div>
  )
}

export default function CalendarPage({ searchParams }: CalendarPageProps) {
  return (
    <div className="container mx-auto py-6">
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
            <h1 className="text-3xl font-bold">Vista de Calendario</h1>
            <p className="text-muted-foreground">
              Calendario interactivo para gestionar reservas de espacios
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<CalendarLoading />}>
        <CalendarContent
          selectedSpaceId={searchParams.spaceId}
          view={searchParams.view}
        />
      </Suspense>
    </div>
  )
}