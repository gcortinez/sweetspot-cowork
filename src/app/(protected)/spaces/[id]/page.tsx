import { notFound } from 'next/navigation'
import { getSpaceAction } from '@/lib/actions/space'
import { SpaceCardEnhanced } from '@/components/spaces/space-card-enhanced'
import { SpaceMapView } from '@/components/spaces/space-map-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Settings,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Shield,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

interface SpaceDetailPageProps {
  params: {
    id: string
  }
}

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const result = await getSpaceAction({ id: params.id })

  if (!result.success || !result.data) {
    notFound()
  }

  const space = result.data

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} hours ${remainingMinutes} minutes` : `${hours} hours`
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/spaces">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Spaces
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {space.name}
              <Badge variant={space.isActive ? 'default' : 'secondary'}>
                {space.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {formatSpaceType(space.type)} • Created {new Date(space.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/spaces/${space.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Space
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/bookings/new?spaceId=${space.id}`}>
              <Calendar className="h-4 w-4 mr-1" />
              Book Space
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Space Card Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Space Preview</CardTitle>
              <CardDescription>How this space appears to users</CardDescription>
            </CardHeader>
            <CardContent>
              <SpaceCardEnhanced space={space} showActions={false} />
            </CardContent>
          </Card>

          {/* Description */}
          {space.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{space.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Booking Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Booking Rules & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Duration Limits
                  </div>
                  <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                    <div>Minimum: {formatDuration(space.minBookingDuration)}</div>
                    {space.maxBookingDuration && (
                      <div>Maximum: {formatDuration(space.maxBookingDuration)}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Advance Booking
                  </div>
                  <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                    <div>Up to {space.maxAdvanceBooking} days ahead</div>
                    <div>Cancel {space.cancellationHours}h before start</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {space.requiresApproval && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Requires Approval
                  </Badge>
                )}
                {space.allowRecurring && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Recurring Bookings Allowed
                  </Badge>
                )}
                {!space.requiresApproval && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Instant Booking
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Capacity</span>
                </div>
                <span className="font-medium">{space.capacity} people</span>
              </div>

              {space.area && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Area</span>
                  </div>
                  <span className="font-medium">{space.area} m²</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hourly Rate</span>
                </div>
                <span className="font-medium">{formatCurrency(space.hourlyRate)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(space.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {space.floor && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Floor</span>
                  <span>{space.floor}</span>
                </div>
              )}
              {space.zone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zone</span>
                  <span>{space.zone}</span>
                </div>
              )}
              {!space.floor && !space.zone && (
                <p className="text-sm text-muted-foreground">No location details available</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/spaces/${space.id}/availability`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Availability
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/bookings?spaceId=${space.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Bookings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/spaces/${space.id}/analytics`}>
                  <Users className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Map View */}
          <SpaceMapView space={space} />
        </div>
      </div>
    </div>
  )
}