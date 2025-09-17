'use client'

import { useState } from 'react'
import { deleteSpaceTypeConfigAction } from '@/lib/actions/space-type'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Palette, Settings } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SpaceType {
  id: string
  name: string
  key: string
  description?: string | null
  icon?: string | null
  color?: string | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

interface SpaceTypeListProps {
  spaceTypes: SpaceType[]
  totalCount: number
}

export function SpaceTypeList({ spaceTypes, totalCount }: SpaceTypeListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (spaceType: SpaceType) => {
    setIsDeleting(spaceType.id)
    try {
      const result = await deleteSpaceTypeConfigAction({ id: spaceType.id })

      if (result.success) {
        toast.success('Tipo de espacio eliminado exitosamente')
        // The page will automatically refresh due to revalidatePath
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al eliminar el tipo de espacio')
      }
    } catch (error) {
      console.error('Error deleting space type:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsDeleting(null)
    }
  }

  const getIconDisplay = (icon?: string | null) => {
    if (!icon) return <Settings className="h-5 w-5 text-muted-foreground" />

    // Map icon names to actual icons
    const iconMap: Record<string, React.ReactNode> = {
      users: <div className="h-5 w-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs">👥</div>,
      presentation: <div className="h-5 w-5 bg-purple-500 rounded flex items-center justify-center text-white text-xs">📊</div>,
      phone: <div className="h-5 w-5 bg-green-500 rounded flex items-center justify-center text-white text-xs">📞</div>,
      calendar: <div className="h-5 w-5 bg-yellow-500 rounded flex items-center justify-center text-white text-xs">📅</div>,
      coffee: <div className="h-5 w-5 bg-lime-500 rounded flex items-center justify-center text-white text-xs">☕</div>,
      utensils: <div className="h-5 w-5 bg-red-500 rounded flex items-center justify-center text-white text-xs">🍴</div>,
      sofa: <div className="h-5 w-5 bg-indigo-500 rounded flex items-center justify-center text-white text-xs">🛋️</div>,
    }

    return iconMap[icon] || <Palette className="h-5 w-5 text-muted-foreground" />
  }

  if (spaceTypes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay tipos de espacio</h3>
          <p className="text-muted-foreground mb-4">
            Comienza creando tipos de espacio para organizar tus espacios.
          </p>
          <Button asChild>
            <Link href="/admin/space-types/new">Crear Primer Tipo</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tipos de Espacio Configurados
        </CardTitle>
        <CardDescription>
          Gestiona los tipos de espacios disponibles en tu coworking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spaceTypes.map((spaceType) => (
            <div
              key={spaceType.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  {getIconDisplay(spaceType.icon)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{spaceType.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {spaceType.key}
                    </Badge>
                    {spaceType.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Por defecto
                      </Badge>
                    )}
                    {!spaceType.isActive && (
                      <Badge variant="destructive" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>

                  {spaceType.description && (
                    <p className="text-sm text-muted-foreground max-w-md">
                      {spaceType.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Orden: {spaceType.sortOrder}</span>
                    {spaceType.color && (
                      <div className="flex items-center gap-1">
                        <span>Color:</span>
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: spaceType.color }}
                        />
                        <span>{spaceType.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/space-types/${spaceType.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/space-types/${spaceType.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de espacio
                          "{spaceType.name}" del sistema.
                          {spaceType.isDefault && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                              <strong>Advertencia:</strong> Este es un tipo de espacio por defecto del sistema.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(spaceType)}
                          disabled={isDeleting === spaceType.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting === spaceType.id ? 'Eliminando...' : 'Eliminar Tipo'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {totalCount > spaceTypes.length && (
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {spaceTypes.length} de {totalCount} tipos de espacio
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}