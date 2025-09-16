import { listSpacesAction } from '@/lib/actions/space'
import { SpaceMap } from '@/components/spaces/space-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SpacesMapPage() {
  const result = await listSpacesAction({
    page: 1,
    limit: 100, // Get all spaces for map display
    sortBy: 'name',
    sortOrder: 'asc',
  })

  if (!result.success) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Spaces</CardTitle>
            <CardDescription>
              {result.error || 'Unable to load spaces at this time'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { data: spaces } = result.data
  const spacesWithCoordinates = spaces?.filter(space => space.coordinates) || []

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
              <MapPin className="h-8 w-8" />
              Spaces Map
            </h1>
            <p className="text-muted-foreground">
              Interactive map showing all your spaces
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/spaces/new">
            <Plus className="h-4 w-4 mr-1" />
            Add Space
          </Link>
        </Button>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>All Spaces Overview</CardTitle>
          <CardDescription>
            {spacesWithCoordinates.length} of {spaces?.length || 0} spaces have coordinates set
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {spacesWithCoordinates.length > 0 ? (
            <SpaceMap
              spaces={spacesWithCoordinates}
              height="600px"
              onSpaceSelect={(spaceId) => {
                // This will be handled by the client-side navigation
                window.location.href = `/spaces/${spaceId}`
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              <div className="text-center space-y-4">
                <MapPin className="h-12 w-12 mx-auto opacity-50" />
                <div>
                  <h3 className="text-lg font-medium">No spaces with coordinates</h3>
                  <p className="text-sm">
                    Add coordinates to your spaces to see them on the map
                  </p>
                </div>
                <Button asChild>
                  <Link href="/spaces">
                    Manage Spaces
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {spaces && spaces.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spaces</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaces.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Coordinates</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spacesWithCoordinates.length}</div>
              <p className="text-xs text-muted-foreground">
                {((spacesWithCoordinates.length / spaces.length) * 100).toFixed(1)}% mapped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Spaces</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {spaces.filter(space => space.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently available
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}