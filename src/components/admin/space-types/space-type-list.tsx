'use client'

import { useState } from 'react'
import { deleteSpaceTypeConfigAction, updateSpaceTypesSortOrderAction } from '@/lib/actions/space-type'
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
import { MoreHorizontal, Edit, Trash2, Eye, Palette, Settings, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

function SortableItem({ spaceType, isDeleting, onDelete, onView, onEdit, getIconDisplay }: {
  spaceType: SpaceType
  isDeleting: string | null
  onDelete: (spaceType: SpaceType) => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  getIconDisplay: (icon?: string | null) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: spaceType.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-background"
    >
      <div className="flex items-center gap-4 flex-1">
        <button
          className="cursor-grab hover:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex items-center justify-center">
          {getIconDisplay(spaceType.icon)}
        </div>

        <div className="space-y-1 flex-1">
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
          <DropdownMenuItem onClick={() => onView(spaceType.id)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(spaceType.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
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
                  onClick={() => onDelete(spaceType)}
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
  )
}

export function SpaceTypeList({ spaceTypes: initialSpaceTypes, totalCount }: SpaceTypeListProps) {
  const [spaceTypes, setSpaceTypes] = useState(initialSpaceTypes)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = spaceTypes.findIndex((item) => item.id === active.id)
      const newIndex = spaceTypes.findIndex((item) => item.id === over.id)

      const newSpaceTypes = arrayMove(spaceTypes, oldIndex, newIndex)

      // Update the sortOrder for each item based on its new position
      const updatedSpaceTypes = newSpaceTypes.map((item, index) => ({
        ...item,
        sortOrder: index + 1
      }))

      setSpaceTypes(updatedSpaceTypes)

      // Save the new order to the database
      setIsSaving(true)
      try {
        const result = await updateSpaceTypesSortOrderAction({
          items: updatedSpaceTypes.map((item, index) => ({
            id: item.id,
            sortOrder: index + 1
          }))
        })

        if (result.success) {
          toast.success('Orden actualizado exitosamente')
        } else {
          toast.error(result.error || 'Error al actualizar el orden')
          // Revert the changes on error
          setSpaceTypes(initialSpaceTypes)
        }
      } catch (error) {
        console.error('Error updating sort order:', error)
        toast.error('Ocurrió un error inesperado')
        setSpaceTypes(initialSpaceTypes)
      } finally {
        setIsSaving(false)
      }
    }

    setActiveId(null)
  }

  const handleDelete = async (spaceType: SpaceType) => {
    setIsDeleting(spaceType.id)
    try {
      const result = await deleteSpaceTypeConfigAction({ id: spaceType.id })

      if (result.success) {
        toast.success('Tipo de espacio eliminado exitosamente')
        // Remove the deleted item from the local state
        setSpaceTypes(spaceTypes.filter(st => st.id !== spaceType.id))
        router.refresh()
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

  const handleView = (spaceTypeId: string) => {
    router.push(`/admin/space-types/${spaceTypeId}`)
  }

  const handleEdit = (spaceTypeId: string) => {
    router.push(`/admin/space-types/${spaceTypeId}/edit`)
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
          <Link href="/admin/space-types/new">
            <Button>Crear Primer Tipo</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const activeItem = activeId ? spaceTypes.find(item => item.id === activeId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tipos de Espacio Configurados
        </CardTitle>
        <CardDescription>
          Gestiona los tipos de espacios disponibles en tu coworking. Arrastra y suelta para cambiar el orden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={spaceTypes.map(st => st.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 relative">
              {isSaving && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded">
                  <div className="text-sm text-muted-foreground">Guardando orden...</div>
                </div>
              )}
              {spaceTypes.map((spaceType) => (
                <SortableItem
                  key={spaceType.id}
                  spaceType={spaceType}
                  isDeleting={isDeleting}
                  onDelete={handleDelete}
                  onView={handleView}
                  onEdit={handleEdit}
                  getIconDisplay={getIconDisplay}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow-lg">
                <div className="flex items-center gap-4 flex-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center justify-center">
                    {getIconDisplay(activeItem.icon)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">{activeItem.name}</h4>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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