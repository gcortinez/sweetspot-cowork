'use client'

import { useRouter } from 'next/navigation'
import { BookingCalendar } from './booking-calendar'

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
  isActive: boolean
}

interface CalendarPageWrapperProps {
  bookings: Booking[]
  spaces: Space[]
  selectedSpaceId?: string
  view?: string
}

export function CalendarPageWrapper({
  bookings,
  spaces,
  selectedSpaceId,
  view
}: CalendarPageWrapperProps) {
  const router = useRouter()

  const handleBookingSelect = (booking: Booking) => {
    // Navigate to booking details
    router.push(`/bookings/${booking.id}`)
  }

  const handleDateSelect = (start: Date, end: Date, spaceId?: string) => {
    // Navigate to create booking with pre-filled data
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      ...(spaceId && { spaceId }),
    })
    router.push(`/bookings/new?${params.toString()}`)
  }

  const handleEventDrop = (bookingId: string, newStart: Date, newEnd: Date) => {
    // Handle booking rescheduling
    console.log('Reschedule booking:', bookingId, newStart, newEnd)
    // TODO: In real implementation, call rescheduling server action
  }

  return (
    <BookingCalendar
      bookings={bookings}
      spaces={spaces}
      selectedSpaceId={selectedSpaceId}
      onBookingSelect={handleBookingSelect}
      onDateSelect={handleDateSelect}
      onEventDrop={handleEventDrop}
      view={view as any || 'week'}
      height="700px"
    />
  )
}