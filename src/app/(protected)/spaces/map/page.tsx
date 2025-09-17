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
            <CardTitle>Error al Cargar Espacios</CardTitle>
            <CardDescription>
              {result.error || 'No se pueden cargar los espacios en este momento'}
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
          <Link href="/spaces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver a Espacios
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              Mapa de Espacios
            </h1>
            <p className="text-muted-foreground">
              Mapa interactivo que muestra todos tus espacios
            </p>
          </div>
        </div>
        <Link href="/spaces/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />Agregar Espacio
          </Button>
        </Link>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Vista General de Todos los Espacios</CardTitle>
          <CardDescription>
            {spacesWithCoordinates.length} de {spaces?.length || 0} espacios tienen coordenadas establecidas
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
                  <h3 className="text-lg font-medium">No hay espacios con coordenadas</h3>
                  <p className="text-sm">
                    Agrega coordenadas a tus espacios para verlos en el mapa
                  </p>
                </div>
                <Button asChild>
                  <Link href="/spaces">Gestionar Espacios</Link>
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
              <CardTitle className="text-sm font-medium">Total de Espacios</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaces.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Coordenadas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spacesWithCoordinates.length}</div>
              <p className="text-xs text-muted-foreground">
                {((spacesWithCoordinates.length / spaces.length) * 100).toFixed(1)}% mapeados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espacios Activos</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {spaces.filter(space => space.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Actualmente disponibles
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}