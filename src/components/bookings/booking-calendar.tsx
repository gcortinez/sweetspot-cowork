'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Regular imports for FullCalendar
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'

// Import FullCalendar CSS
import '@fullcalendar/core/vdom'

interface Booking {
  id: string
  title: string
  start: string
  end: string
  spaceId: string
  spaceName: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  attendeeCount?: number
  isRecurring?: boolean
  color?: string
}

interface Space {
  id: string
  name: string
  type: string
  capacity: number
  hourlyRate?: number
  floor?: string
  zone?: string
}

interface BookingCalendarProps {
  bookings: Booking[]
  spaces: Space[]
  selectedSpaceId?: string
  onBookingSelect?: (booking: Booking) => void
  onDateSelect?: (start: Date, end: Date, spaceId?: string) => void
  onEventDrop?: (bookingId: string, newStart: Date, newEnd: Date) => void
  view?: 'month' | 'week' | 'day'
  height?: string
}

export function BookingCalendar({
  bookings,
  spaces,
  selectedSpaceId,
  onBookingSelect,
  onDateSelect,
  onEventDrop,
  view = 'week',
  height = '600px',
}: BookingCalendarProps) {
  const [currentView, setCurrentView] = useState(view)
  const [selectedSpace, setSelectedSpace] = useState(selectedSpaceId || 'all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const getBookingColor = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10b981' // green-500
      case 'PENDING':
        return '#f59e0b' // amber-500
      case 'CANCELLED':
        return '#ef4444' // red-500
      case 'COMPLETED':
        return '#6b7280' // gray-500
      default:
        return '#3b82f6' // blue-500
    }
  }

  const filteredBookings = selectedSpace === 'all'
    ? bookings
    : bookings.filter(b => b.spaceId === selectedSpace)

  const calendarEvents = filteredBookings.map(booking => ({
    id: booking.id,
    title: booking.title,
    start: booking.start,
    end: booking.end,
    backgroundColor: booking.color || getBookingColor(booking.status),
    borderColor: booking.color || getBookingColor(booking.status),
    className: `booking-${booking.status.toLowerCase()}`,
    extendedProps: { booking }
  }))

  const handleEventClick = useCallback((info: EventClickArg) => {
    if (onBookingSelect) {
      const booking = info.event.extendedProps.booking as Booking
      onBookingSelect(booking)
    }
  }, [onBookingSelect])

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(info.start, info.end, selectedSpace === 'all' ? undefined : selectedSpace)
    }
  }, [onDateSelect, selectedSpace])

  const handleEventDrop = useCallback((info: EventDropArg) => {
    if (onEventDrop) {
      onEventDrop(info.event.id, info.event.start!, info.event.end!)
    }
  }, [onEventDrop])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[500px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Reservas
            </CardTitle>
            <CardDescription>
              {filteredBookings.length} reservas en el calendario
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Space Filter */}
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md"
            >
              <option value="all">Todos los espacios</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>

            {/* View Selector */}
            <div className="flex gap-1">
              <Button
                variant={currentView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('month')}
              >
                Mes
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('week')}
              >
                Semana
              </Button>
              <Button
                variant={currentView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('day')}
              >
                Día
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div style={{ height }} className="w-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: onDateSelect ? 'dayGridMonth,timeGridWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView={
              currentView === 'month'
                ? 'dayGridMonth'
                : currentView === 'week'
                ? 'timeGridWeek'
                : 'timeGridDay'
            }
            viewDidMount={(info) => {
              // Sync view changes with our state
              const viewName = info.view.type
              if (viewName === 'dayGridMonth') setCurrentView('month')
              else if (viewName === 'timeGridWeek') setCurrentView('week')
              else if (viewName === 'timeGridDay') setCurrentView('day')
            }}
            editable={!!onEventDrop}
            selectable={!!onDateSelect}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={calendarEvents}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            height="auto"
            eventContent={(eventInfo) => {
              const { booking } = eventInfo.event.extendedProps
              return (
                <div className="p-1 text-xs">
                  <div className="font-semibold truncate">{eventInfo.event.title}</div>
                  <div className="text-[10px] opacity-90 truncate">
                    {booking.spaceName}
                  </div>
                  {booking.attendeeCount && (
                    <div className="text-[10px] flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {booking.attendeeCount}
                    </div>
                  )}
                </div>
              )
            }}
            locale="es"
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric',
              month: 'numeric',
            }}
            titleFormat={{
              year: 'numeric',
              month: 'long',
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}