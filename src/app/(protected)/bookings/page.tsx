import { Suspense } from 'react'
import { BookingCalendar } from '@/components/bookings/booking-calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Plus, Clock, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// Mock data - in real implementation, this would come from server actions
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
]

const mockSpaces = [
  {
    id: 'space-1',
    name: 'Conference Room A',
    type: 'MEETING_ROOM',
    capacity: 15,
    hourlyRate: 50,
    floor: '2nd Floor',
    zone: 'East Wing',
  },
  {
    id: 'space-2',
    name: 'Meeting Room B',
    type: 'MEETING_ROOM',
    capacity: 8,
    hourlyRate: 30,
    floor: '1st Floor',
    zone: 'West Wing',
  },
]

async function BookingsContent() {
  // In real implementation, fetch data from server actions
  const bookings = mockBookings
  const spaces = mockSpaces

  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
    pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
    recurringBookings: bookings.filter(b => b.isRecurring).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Todas las reservas próximas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">
              Listas para usar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Aprobación</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurrentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recurringBookings}</div>
            <p className="text-xs text-muted-foreground">
              Eventos que se repiten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <BookingCalendar
        bookings={bookings}
        spaces={spaces}
        onBookingSelect={(booking) => {
          // Navigate to booking details
          console.log('Selected booking:', booking)
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
        view="week"
        height="600px"
      />
    </div>
  )
}

function BookingsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Calendar Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Reservas
          </h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todas las reservas de espacios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/bookings/calendar">
              <Calendar className="h-4 w-4 mr-1" />
              Vista de Calendario
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bookings/new">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Reserva
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<BookingsLoading />}>
        <BookingsContent />
      </Suspense>
    </div>
  )
}