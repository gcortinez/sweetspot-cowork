'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingCalendar } from './booking-calendar'
import { BookingModal } from './booking-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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
  isActive?: boolean
  requiresApproval?: boolean
}

interface BookingCalendarWrapperProps {
  bookings: Booking[]
  spaces: Space[]
}

export function BookingCalendarWrapper({ bookings, spaces }: BookingCalendarWrapperProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<{
    spaceId?: string
    date?: Date
    startTime?: string
    endTime?: string
  }>({})

  const handleBookingSelect = (booking: Booking) => {
    // Navigate to booking details
    router.push(`/bookings/${booking.id}`)
  }

  const handleDateSelect = (start: Date, end: Date, spaceId?: string) => {
    console.log('BookingCalendarWrapper - Date selected:', {
      start,
      end,
      spaceId
    })

    // Open modal with pre-filled data
    const startHours = start.getHours().toString().padStart(2, '0')
    const startMinutes = start.getMinutes().toString().padStart(2, '0')
    const endHours = end.getHours().toString().padStart(2, '0')
    const endMinutes = end.getMinutes().toString().padStart(2, '0')

    const modalDataToSet = {
      spaceId,
      date: start,
      startTime: `${startHours}:${startMinutes}`,
      endTime: `${endHours}:${endMinutes}`,
    }

    console.log('BookingCalendarWrapper - Setting modal data:', modalDataToSet)

    setModalData(modalDataToSet)
    setModalOpen(true)
  }

  const handleNewBooking = () => {
    setModalData({})
    setModalOpen(true)
  }

  // Filter only active spaces
  const activeSpaces = spaces.filter(s => s.isActive !== false)

  // Map bookings to include spaceName from the related space object
  const formattedBookings = (bookings || []).map(booking => {
    // Handle both cases: when booking has space object or when it has spaceId
    const spaceName = (booking as any).space?.name ||
                      spaces.find(s => s.id === booking.spaceId)?.name ||
                      'Espacio desconocido'

    return {
      ...booking,
      spaceName,
      title: booking.title || 'Reserva',
      start: booking.start || (booking as any).startTime,
      end: booking.end || (booking as any).endTime,
      status: booking.status || 'CONFIRMED',
    }
  }).filter(booking => booking.start && booking.end) // Filter out bookings without dates

  return (
    <>
      {/* Header with New Booking Button */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Calendario de Reservas</h2>
        <Button onClick={handleNewBooking} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nueva Reserva
        </Button>
      </div>

      {/* Calendar */}
      <BookingCalendar
        bookings={formattedBookings}
        spaces={activeSpaces}
        onBookingSelect={handleBookingSelect}
        onDateSelect={handleDateSelect}
        view="week"
        height="600px"
      />

      {/* Booking Modal */}
      <BookingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        spaces={activeSpaces}
        selectedSpaceId={modalData.spaceId}
        selectedDate={modalData.date}
        selectedStartTime={modalData.startTime}
        selectedEndTime={modalData.endTime}
      />
    </>
  )
}