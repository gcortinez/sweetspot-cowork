import { Suspense } from 'react'
import { listSpaceTypeConfigsAction, createDefaultSpaceTypesAction } from '@/lib/actions/space-type'
import { SpaceTypeList } from '@/components/admin/space-types/space-type-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, Plus, Palette } from 'lucide-react'
import Link from 'next/link'

async function SpaceTypesContent() {
  const result = await listSpaceTypeConfigsAction({
    page: 1,
    limit: 50,
    sortBy: 'sortOrder',
    sortOrder: 'asc',
  })

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al Cargar Tipos de Espacio</CardTitle>
          <CardDescription>
            {result.error || 'No se pudieron cargar los tipos de espacio en este momento'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { spaceTypeConfigs, totalCount } = result.data

  const handleCreateDefaults = async () => {
    'use server'

    const result = await createDefaultSpaceTypesAction({ overwrite: false })

    if (!result.success) {
      console.error('Error creating default space types:', result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tipos</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Tipos de espacio configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos Activos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {spaceTypeConfigs.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para usar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos por Defecto</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spaceTypeConfigs.filter(t => t.isDefault).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Space Types List */}
      <SpaceTypeList spaceTypes={spaceTypeConfigs} totalCount={totalCount} />

      {/* Create Defaults Section */}
      {spaceTypeConfigs.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comenzar con Tipos por Defecto</CardTitle>
            <CardDescription>
              No tienes tipos de espacio configurados. Puedes crear los tipos por defecto para comenzar rápidamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleCreateDefaults}>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Crear Tipos por Defecto
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SpaceTypesLoading() {
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
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SpaceTypesPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8" />
            Tipos de Espacio
          </h1>
          <p className="text-muted-foreground">
            Configura y gestiona los tipos de espacios disponibles en tu coworking
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/space-types/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo
          </Link>
        </Button>
      </div>

      <Suspense fallback={<SpaceTypesLoading />}>
        <SpaceTypesContent />
      </Suspense>
    </div>
  )
}