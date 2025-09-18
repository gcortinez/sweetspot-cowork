import { Suspense } from 'react'
import { listSpacesAction } from '@/lib/actions/space'
import { CalendarPageWrapper } from '@/components/bookings/calendar-page-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    start: '2025-01-20T09:00:00',
    end: '2025-01-20T11:00:00',
    spaceId: 'space-1',
    spaceName: 'Conference Room A',
    status: 'CONFIRMED' as const,
    attendeeCount: 8,
    isRecurring: false,
  },
  {
    id: '2',
    title: 'Weekly Standup',
    start: '2025-01-21T10:00:00',
    end: '2025-01-21T11:00:00',
    spaceId: 'space-2',
    spaceName: 'Meeting Room B',
    status: 'CONFIRMED' as const,
    attendeeCount: 5,
    isRecurring: true,
  },
  {
    id: '3',
    title: 'Client Presentation',
    start: '2025-01-22T14:00:00',
    end: '2025-01-22T16:00:00',
    spaceId: 'space-1',
    spaceName: 'Conference Room A',
    status: 'PENDING' as const,
    attendeeCount: 12,
    isRecurring: false,
  },
  {
    id: '4',
    title: 'Board Meeting',
    start: '2025-01-23T15:00:00',
    end: '2025-01-23T17:00:00',
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

export default function CalendarPage({ searchParams }: CalendarPageProps) {
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
          selectedSpaceId={searchParams.spaceId}
          view={searchParams.view}
        />
      </Suspense>
    </div>
  )
}