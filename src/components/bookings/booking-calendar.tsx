'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { darkenColor, lightenColor } from '@/lib/utils/colors'

// Regular imports for FullCalendar
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'

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
  color?: string
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
  const [selectedSpace, setSelectedSpace] = useState(selectedSpaceId || 'all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const getBookingColor = (booking: Booking, spaces: Space[]) => {
    // First priority: Use the space's color
    const space = spaces.find(s => s.id === booking.spaceId)
    if (space?.color) {
      return space.color
    }

    // Second priority: Use booking's own color
    if (booking.color) {
      return booking.color
    }

    // Fallback: Use color based on status
    switch (booking.status) {
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

  const calendarEvents = filteredBookings.map(booking => {
    let backgroundColor = getBookingColor(booking, spaces)
    let borderColor = darkenColor(backgroundColor, 15)

    // Apply visual effects based on status
    switch (booking.status) {
      case 'PENDING':
        // Make pending bookings lighter/faded
        backgroundColor = lightenColor(backgroundColor, 30)
        borderColor = backgroundColor
        break
      case 'CANCELLED':
        // Make cancelled bookings very faded
        backgroundColor = lightenColor(backgroundColor, 50)
        borderColor = darkenColor(backgroundColor, 20)
        break
      case 'COMPLETED':
        // Make completed bookings slightly faded
        backgroundColor = lightenColor(backgroundColor, 20)
        break
      default:
        // Normal confirmed bookings
        break
    }

    return {
      id: booking.id,
      title: booking.title || 'Sin título',
      start: booking.start,
      end: booking.end,
      backgroundColor,
      borderColor,
      className: `booking-${booking.status?.toLowerCase() || 'confirmed'}`,
      extendedProps: {
        booking: {
          ...booking,
          spaceName: booking.spaceName || 'Espacio no especificado'
        }
      }
    }
  })

  const handleEventClick = useCallback((info: EventClickArg) => {
    if (onBookingSelect && info.event.extendedProps?.booking) {
      const booking = info.event.extendedProps.booking as Booking
      onBookingSelect(booking)
    }
  }, [onBookingSelect])

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    console.log('Date selection triggered:', {
      start: info.start,
      end: info.end,
      allDay: info.allDay,
      view: info.view.type
    })

    // Only process time selections, not all-day selections
    if (onDateSelect && !info.allDay) {
      // Call the handler with the selected time range
      onDateSelect(info.start, info.end, selectedSpace === 'all' ? undefined : selectedSpace)

      // Unselect after processing
      info.view.calendar.unselect()
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
    <Card className="overflow-hidden">
      {/* Calendar wrapper with Tailwind CSS classes for styling FullCalendar components */}
      <div className="fc-calendar-wrapper [&_.fc-highlight]:bg-purple-600/30 [&_.fc-highlight]:border-2 [&_.fc-highlight]:border-purple-600 [&_.fc-highlight]:rounded [&_.fc-timegrid-slot:hover]:bg-purple-600/5 [&_.fc-timegrid-slot]:cursor-crosshair [&_.fc-event]:cursor-pointer [&_.fc-event]:transition-all [&_.fc-event]:border-0 [&_.fc-event:hover]:scale-[1.02] [&_.fc-event:hover]:shadow-md [&_.fc-timegrid-slot-lane]:cursor-crosshair [&_.fc-timegrid_.fc-col-header-cell]:cursor-crosshair">
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
              className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los espacios</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name} ({space.capacity} personas)
                </option>
              ))}
            </select>

            {/* Nueva Reserva Button */}
            <Button onClick={() => window.location.href = '/bookings/new'}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Reserva
            </Button>

          </div>
        </div>
      </CardHeader>

      {/* Color Legend */}
      {selectedSpace === 'all' && spaces.length > 1 && (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Espacios:</span>
            {spaces.map((space) => (
              <div key={space.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: space.color || '#3b82f6' }}
                />
                <span className="text-sm text-foreground">{space.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="w-full" style={{ height: height }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: onDateSelect ? 'dayGridMonth,timeGridWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView={
              view === 'month'
                ? 'dayGridMonth'
                : view === 'week'
                ? 'timeGridWeek'
                : 'timeGridDay'
            }
            editable={!!onEventDrop}
            selectable={true}
            selectMirror={true}
            selectOverlap={false}
            unselectAuto={false}
            selectMinDistance={5}
            dayMaxEvents={true}
            weekends={true}
            events={calendarEvents}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventStartEditable={false}
            eventDurationEditable={false}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            height={height}
            contentHeight={600}
            expandRows={false}
            scrollTime="08:00:00"
            eventContent={(eventInfo) => {
              const booking = eventInfo.event.extendedProps?.booking

              // If no booking data (e.g., during selection), show simple title
              if (!booking) {
                return (
                  <div className="p-1 text-xs">
                    <div className="font-semibold truncate">{eventInfo.event.title}</div>
                  </div>
                )
              }

              return (
                <div className="p-1 text-xs">
                  <div className="font-semibold truncate">{eventInfo.event.title}</div>
                  <div className="text-[10px] opacity-90 truncate">
                    {booking.spaceName || 'Espacio no asignado'}
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
      </div>
    </Card>
  )
}