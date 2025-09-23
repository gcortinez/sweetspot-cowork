import { Suspense } from 'react'
import { assignColorsToExistingSpacesAction, listSpacesAction } from '@/lib/actions/space'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Palette, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function AssignColorsContent() {
  const result = await listSpacesAction({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const spaces = result.success ? (result.data?.spaces || []) : []

  const spacesWithoutColor = spaces.filter(space => !space.color)
  const spacesWithColor = spaces.filter(space => space.color)

  const handleAssignColors = async () => {
    'use server'

    const result = await assignColorsToExistingSpacesAction()

    if (result.success) {
      console.log('Colors assigned successfully')
    } else {
      console.error('Error assigning colors:', result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Espacios</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spaces.length}</div>
            <p className="text-xs text-muted-foreground">
              Espacios en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Color Asignado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{spacesWithColor.length}</div>
            <p className="text-xs text-muted-foreground">
              Listos para el calendario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Color</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{spacesWithoutColor.length}</div>
            <p className="text-xs text-muted-foreground">
              Necesitan color asignado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Card */}
      {spacesWithoutColor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Espacios Sin Color Asignado
            </CardTitle>
            <CardDescription>
              {spacesWithoutColor.length} espacios necesitan un color para aparecer correctamente en el calendario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                {spacesWithoutColor.map((space) => (
                  <div key={space.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{space.name}</div>
                      <div className="text-sm text-muted-foreground">{space.type}</div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      Sin color
                    </Badge>
                  </div>
                ))}
              </div>

              <form action={handleAssignColors}>
                <Button type="submit" className="w-full">
                  <Palette className="h-4 w-4 mr-2" />
                  Asignar Colores Automáticamente
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spaces with Colors */}
      {spacesWithColor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Espacios con Color Asignado
            </CardTitle>
            <CardDescription>
              Estos espacios ya tienen colores y aparecen correctamente en el calendario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {spacesWithColor.map((space) => (
                <div key={space.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: space.color }}
                    />
                    <div>
                      <div className="font-medium">{space.name}</div>
                      <div className="text-sm text-muted-foreground">{space.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600">
                      {space.color}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {spacesWithoutColor.length === 0 && spaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Todos los Espacios Tienen Colores
            </CardTitle>
            <CardDescription>
              Perfecto! Todos los espacios tienen colores asignados y aparecerán correctamente en el calendario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Puedes modificar los colores editando cada espacio individualmente desde la página de espacios.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AssignColorsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AssignSpaceColorsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/spaces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a Espacios
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Palette className="h-8 w-8" />
              Asignar Colores a Espacios
            </h1>
            <p className="text-muted-foreground">
              Gestiona los colores del calendario para cada espacio
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<AssignColorsLoading />}>
        <AssignColorsContent />
      </Suspense>
    </div>
  )
}