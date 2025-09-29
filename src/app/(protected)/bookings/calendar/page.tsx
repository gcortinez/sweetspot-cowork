import { Suspense } from 'react'
import { listSpacesAction } from '@/lib/actions/space'
import { listBookingsAction } from '@/lib/actions/booking'
import { CalendarPageWrapper } from '@/components/bookings/calendar-page-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, Plus, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

interface CalendarPageProps {
  searchParams: Promise<{
    spaceId?: string
    view?: 'month' | 'week' | 'day'
  }>
}

async function CalendarContent({ selectedSpaceId, view }: { selectedSpaceId?: string, view?: string }) {
  // Fetch spaces and bookings in parallel
  const [spacesResult, bookingsResult] = await Promise.all([
    listSpacesAction({
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
    listBookingsAction({
      page: 1,
      limit: 1000,
      sortBy: 'startTime',
      sortOrder: 'asc',
      spaceId: selectedSpaceId,
    }),
  ])

  if (!spacesResult.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al Cargar Calendario</CardTitle>
          <CardDescription>
            {spacesResult.error || 'No se puede cargar el calendario de reservas en este momento'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const spaces = spacesResult.data?.spaces || []
  const activeSpaces = spaces.filter(space => space.isActive)

  // Get bookings and transform them for the calendar
  const allBookings = bookingsResult.success ? (bookingsResult.data?.bookings || []) : []

  // Transform bookings to match calendar format
  const bookings = allBookings.map(booking => ({
    id: booking.id,
    title: booking.title,
    start: new Date(booking.startTime).toISOString(),
    end: new Date(booking.endTime).toISOString(),
    spaceId: booking.spaceId,
    spaceName: booking.space?.name || 'Espacio no encontrado',
    status: booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
    attendeeCount: booking.attendeeCount,
    isRecurring: false, // TODO: Add recurrence support
    color: booking.space?.color,
  }))

  const selectedSpace = selectedSpaceId ? activeSpaces.find(s => s.id === selectedSpaceId) : null

  return (
    <div className="space-y-6">
      {/* Calendar - Client Component wrapper */}
      <CalendarPageWrapper
        bookings={bookings}
        spaces={activeSpaces}
        selectedSpaceId={selectedSpaceId}
        view={view}
      />
    </div>
  )
}

function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Calendar Skeleton */}
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
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="w-full h-96" />
        </CardContent>
      </Card>
    </div>
  )
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Reservas
            </Button>
          </Link>
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
          selectedSpaceId={params.spaceId}
          view={params.view}
        />
      </Suspense>
    </div>
  )
}