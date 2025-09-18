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
}

interface BookingCalendarWrapperProps {
  bookings: Booking[]
  spaces: Space[]
}

export function BookingCalendarWrapper({ bookings, spaces }: BookingCalendarWrapperProps) {
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

  return (
    <BookingCalendar
      bookings={bookings}
      spaces={spaces}
      onBookingSelect={handleBookingSelect}
      onDateSelect={handleDateSelect}
      view="week"
      height="600px"
    />
  )
}