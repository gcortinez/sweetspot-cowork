import { notFound } from 'next/navigation'
import { listSpacesAction } from '@/lib/actions/space'
import { AdvancedBookingForm } from '@/components/bookings/advanced-booking-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

interface NewBookingPageProps {
  searchParams: {
    spaceId?: string
    start?: string
    end?: string
  }
}

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const result = await listSpacesAction({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  if (!result.success) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error al Cargar Espacios</h1>
          <p className="text-muted-foreground mb-4">
            {result.error || 'No se pueden cargar los espacios para reservar'}
          </p>
          <Link href="/bookings">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Reservas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { data: spaces } = result.data
  const activeSpaces = spaces?.filter(space => space.isActive) || []

  if (activeSpaces.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Hay Espacios Activos Disponibles</h1>
          <p className="text-muted-foreground mb-4">
            No hay espacios activos disponibles para reservar en este momento.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/bookings">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />Volver a Reservas
              </Button>
            </Link>
            <Button asChild>
              <Link href="/spaces">Ver Espacios</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Parse URL parameters for pre-filling the form
  const selectedSpaceId = searchParams.spaceId
  const defaultStartTime = searchParams.start ? new Date(searchParams.start).toISOString().slice(0, 16) : undefined
  const defaultEndTime = searchParams.end ? new Date(searchParams.end).toISOString().slice(0, 16) : undefined

  const handleSubmit = async (data: any) => {
    'use server'

    // In real implementation, this would call the booking server action
    console.log('Creating booking:', data)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Redirect to bookings page
    // redirect('/bookings')
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Reservas
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Nueva Reserva
            </h1>
            <p className="text-muted-foreground">
              Crear una nueva reserva de espacio con opciones avanzadas
            </p>
          </div>
        </div>
      </div>

      <AdvancedBookingForm
        spaces={activeSpaces}
        selectedSpaceId={selectedSpaceId}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        onSubmit={handleSubmit}
      />
    </div>
  )
}