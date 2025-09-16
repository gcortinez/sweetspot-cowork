'use client'

import { useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic imports for FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })
const dayGridPlugin = dynamic(() => import('@fullcalendar/daygrid'), { ssr: false })
const timeGridPlugin = dynamic(() => import('@fullcalendar/timegrid'), { ssr: false })
const interactionPlugin = dynamic(() => import('@fullcalendar/interaction'), { ssr: false })

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
  const [isClient, setIsClient] = useState(false)
  const [currentView, setCurrentView] = useState(view)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getEventColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10b981' // green
      case 'PENDING':
        return '#f59e0b' // yellow
      case 'CANCELLED':
        return '#ef4444' // red
      case 'COMPLETED':
        return '#6b7280' // gray
      default:
        return '#3b82f6' // blue
    }
  }

  const calendarEvents = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.title} (${booking.spaceName})`,
    start: booking.start,
    end: booking.end,
    backgroundColor: booking.color || getEventColor(booking.status),
    borderColor: booking.color || getEventColor(booking.status),
    extendedProps: {
      booking,
      spaceId: booking.spaceId,
      status: booking.status,
      attendeeCount: booking.attendeeCount,
      isRecurring: booking.isRecurring,
    },
  }))

  const handleEventClick = useCallback((info: any) => {
    const booking = info.event.extendedProps.booking
    if (onBookingSelect) {
      onBookingSelect(booking)
    }
  }, [onBookingSelect])

  const handleDateSelect = useCallback((info: any) => {
    if (onDateSelect) {
      onDateSelect(info.start, info.end, selectedSpaceId)
    }
  }, [onDateSelect, selectedSpaceId])

  const handleEventDrop = useCallback((info: any) => {
    if (onEventDrop) {
      onEventDrop(info.event.id, info.event.start, info.event.end)
    }
  }, [onEventDrop])

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Calendar
          </CardTitle>
          <CardDescription>
            View and manage all bookings in calendar format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96 rounded-lg" />
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
              Booking Calendar
              {selectedSpaceId && (
                <Badge variant="outline">
                  {spaces.find(s => s.id === selectedSpaceId)?.name || 'Selected Space'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedSpaceId
                ? `Showing bookings for selected space`
                : `Showing ${bookings.length} bookings across ${spaces.length} spaces`
              }
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('month')}
            >
              Month
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('week')}
            >
              Week
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('day')}
            >
              Day
            </Button>
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
                  <div className="font-medium truncate">
                    {eventInfo.event.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1 opacity-90">
                    {booking.attendeeCount && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {booking.attendeeCount}
                      </span>
                    )}
                    {booking.isRecurring && (
                      <span className="text-xs">↻</span>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          {onDateSelect && (
            <div className="flex items-center gap-2 ml-auto">
              <Plus className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Click and drag to create booking</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}