import { Suspense } from 'react'
import { listSpacesAction } from '@/lib/actions/space'
import { SpaceList } from '@/components/spaces/space-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

async function SpacesContent() {
  const result = await listSpacesAction({
    page: 1,
    limit: 50, // Get more spaces for better overview
    sortBy: 'name',
    sortOrder: 'asc',
  })

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al Cargar Espacios</CardTitle>
          <CardDescription>
            {result.error || 'No se pueden cargar los espacios en este momento'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { spaces, pagination } = result.data

  return <SpaceList spaces={spaces || []} totalCount={pagination?.total || 0} />
}

function SpacesLoading() {
  return (
    <div className="space-y-4">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SpacesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Espacios</h1>
          <p className="text-muted-foreground">
            Gestiona tus espacios de coworking y su disponibilidad
          </p>
        </div>
      </div>

      <Suspense fallback={<SpacesLoading />}>
        <SpacesContent />
      </Suspense>
    </div>
  )
}