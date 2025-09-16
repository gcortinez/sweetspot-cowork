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
          <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Spaces</h1>
          <p className="text-muted-foreground mb-4">
            {result.error || 'Unable to load spaces for booking'}
          </p>
          <Button asChild>
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Bookings
            </Link>
          </Button>
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
          <h1 className="text-2xl font-bold mb-2">No Active Spaces Available</h1>
          <p className="text-muted-foreground mb-4">
            There are no active spaces available for booking at this time.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/bookings">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Bookings
              </Link>
            </Button>
            <Button asChild>
              <Link href="/spaces">
                View Spaces
              </Link>
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Bookings
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              New Booking
            </h1>
            <p className="text-muted-foreground">
              Create a new space booking with advanced options
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