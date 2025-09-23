'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  DollarSign,
  Settings,
  Shield,
  Clock,
  EyeOff,
  RotateCcw,
  Loader2,
  Palette,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteSpaceAction, reactivateSpaceAction, permanentDeleteSpaceAction } from '@/lib/actions/space'
import { toast } from 'sonner'
import { AddSpaceModal } from './modals/add-space-modal'
import { EditSpaceModal } from './modals/edit-space-modal'

// Define a simplified Space type for the list view
interface SpaceListItem {
  id: string
  name: string
  type: string
  description?: string
  capacity: number
  floor?: string
  zone?: string
  area?: number
  hourlyRate?: number
  isActive: boolean
  requiresApproval: boolean
  allowRecurring: boolean
  minBookingDuration?: number
  maxAdvanceBooking?: number
  cancellationHours?: number
  createdAt: Date
  updatedAt: Date
}

interface SpaceListProps {
  spaces: SpaceListItem[]
  totalCount: number
}

export function SpaceList({ spaces, totalCount }: SpaceListProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [spaceToDelete, setSpaceToDelete] = useState<SpaceListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [spaceToView, setSpaceToView] = useState<SpaceListItem | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [spaceToEdit, setSpaceToEdit] = useState<SpaceListItem | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const showSpinnerTemporarily = (duration: number = 500) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    setIsRefreshing(true)
    refreshTimeoutRef.current = setTimeout(() => {
      setIsRefreshing(false)
      refreshTimeoutRef.current = null
    }, duration)
  }

  const handleDeleteSpace = async () => {
    if (!spaceToDelete) return

    setIsDeleting(true)
    try {
      const result = await permanentDeleteSpaceAction({ id: spaceToDelete.id })

      if (result.success) {
        toast.success('Espacio eliminado permanentemente')
        setDeleteDialogOpen(false)
        setSpaceToDelete(null)
        router.refresh()
        showSpinnerTemporarily(600)
      } else {
        toast.error(result.error || 'Error al eliminar el espacio')
      }
    } catch (error) {
      console.error('Permanent delete space error:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (space: SpaceListItem) => {
    // Prevent multiple simultaneous actions
    if (isRefreshing) return

    try {
      let result

      if (space.isActive) {
        // Desactivar (soft delete)
        result = await deleteSpaceAction({ id: space.id })
        if (result.success) {
          toast.success('Espacio desactivado exitosamente')
        } else {
          toast.error(result.error || 'Error al desactivar el espacio')
        }
      } else {
        // Activar
        result = await reactivateSpaceAction({ id: space.id })
        if (result.success) {
          toast.success('Espacio activado exitosamente')
        } else {
          toast.error(result.error || 'Error al activar el espacio')
        }
      }

      if (result.success) {
        router.refresh()
        showSpinnerTemporarily(400)
      }
    } catch (error) {
      console.error('Toggle active space error:', error)
      toast.error('Ocurrió un error inesperado')
    }
  }

  // Memoize filtered spaces to avoid re-filtering on every render
  const filteredSpaces = useMemo(
    () => showInactive ? spaces : spaces.filter(space => space.isActive),
    [spaces, showInactive]
  )

  // Memoize statistics calculations to avoid re-computing on every render
  const statistics = useMemo(() => {
    const activeSpaces = spaces.filter(s => s.isActive)
    const totalCapacity = spaces.reduce((sum, space) => sum + space.capacity, 0)
    const spacesWithRate = spaces.filter(s => s.hourlyRate)
    const averageRate = spacesWithRate.length > 0
      ? spaces.reduce((sum, space) => sum + (space.hourlyRate || 0), 0) / spacesWithRate.length
      : 0
    const requireApprovalCount = spaces.filter(s => s.requiresApproval).length

    return {
      totalCount: spaces.length,
      activeCount: activeSpaces.length,
      totalCapacity,
      averageRate,
      requireApprovalCount
    }
  }, [spaces])

  // Memoize column definitions to avoid recreating on every render
  const columns: ColumnDef<SpaceListItem>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Nombre del Espacio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const space = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{space.name}</span>
            {space.description && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {space.description}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Tipo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        return (
          <Badge variant="secondary">
            {formatSpaceType(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'capacity',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            <Users className="h-4 w-4 mr-1" />
            Capacidad
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            {row.getValue('capacity')}
          </div>
        )
      },
    },
    {
      accessorKey: 'location',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Ubicación
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const space = row.original
        const location = [space.floor, space.zone].filter(Boolean).join(', ') || '-'
        return (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm">{location}</span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const locationA = [rowA.original.floor, rowA.original.zone].filter(Boolean).join(', ') || ''
        const locationB = [rowB.original.floor, rowB.original.zone].filter(Boolean).join(', ') || ''
        return locationA.localeCompare(locationB)
      },
    },
    {
      accessorKey: 'hourlyRate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Tarifa
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rate = row.getValue('hourlyRate') as number
        return (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
            {formatCurrency(rate)}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Estado
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const space = row.original
        const isActive = space.isActive
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <div className="flex gap-1">
              {space.requiresApproval && (
                <Badge variant="outline" className="text-xs">
                  Requiere Aprobación
                </Badge>
              )}
              {space.allowRecurring && (
                <Badge variant="outline" className="text-xs">
                  Recurrente
                </Badge>
              )}
            </div>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const statusA = rowA.original.isActive ? 'Activo' : 'Inactivo'
        const statusB = rowB.original.isActive ? 'Activo' : 'Inactivo'
        return statusA.localeCompare(statusB)
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const space = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(space.id)}
              >
                Copiar ID del espacio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/spaces/${space.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSpaceToEdit(space)
                  setEditModalOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar espacio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/spaces/${space.id}/availability`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Gestionar disponibilidad
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleActive(space)}
                className={space.isActive ? "text-orange-600" : "text-green-600"}
              >
                {space.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Desactivar espacio
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Activar espacio
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSpaceToDelete(space)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [router, handleToggleActive, setSpaceToDelete, setDeleteDialogOpen, setSpaceToEdit, setEditModalOpen, setSpaceToView, setDetailModalOpen])

  const table = useReactTable({
    data: filteredSpaces,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Espacios</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeCount} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">
              personas en todos los espacios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarifa Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.averageRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              promedio por hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requieren Aprobación</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.requireApprovalCount}
            </div>
            <p className="text-xs text-muted-foreground">
              espacios necesitan aprobación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar espacios..."
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={showInactive ? "default" : "outline"}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showInactive ? "Ocultar Inactivos" : "Mostrar Inactivos"}
          </Button>
          <Link href="/admin/assign-space-colors">
            <Button variant="outline">
              <Palette className="mr-2 h-4 w-4" />
              Gestionar Colores
            </Button>
          </Link>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Espacio
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border relative">
        {isRefreshing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">Actualizando lista...</span>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    // Don't open modal if clicking on the actions dropdown
                    const target = e.target as HTMLElement
                    if (target.closest('[data-radix-collection-item]') ||
                        target.closest('button') ||
                        target.closest('[role="button"]')) {
                      return
                    }
                    setSpaceToView(row.original)
                    setDetailModalOpen(true)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron espacios.
                  <Button
                    variant="link"
                    onClick={() => setAddModalOpen(true)}
                    className="ml-1"
                  >
                    Crear tu primer espacio
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el espacio
              "{spaceToDelete?.name}" y removerá todos los datos asociados incluyendo reservas,
              horarios de disponibilidad y registros de mantenimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpace}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Espacio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Space Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Rápida - {spaceToView?.name}
            </DialogTitle>
            <DialogDescription>
              Información resumida del espacio
            </DialogDescription>
          </DialogHeader>
          {spaceToView && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{spaceToView.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{formatSpaceType(spaceToView.type)}</Badge>
                      <Badge variant={spaceToView.isActive ? 'default' : 'secondary'}>
                        {spaceToView.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {spaceToView.description && (
                      <p className="text-muted-foreground">{spaceToView.description}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Capacidad: {spaceToView.capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Tarifa: {formatCurrency(spaceToView.hourlyRate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Ubicación: {[spaceToView.floor, spaceToView.zone].filter(Boolean).join(', ') || 'No especificada'}</span>
                    </div>
                    {spaceToView.area && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Área: {spaceToView.area} m²</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Configuración</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {spaceToView.requiresApproval ? 'Requiere aprobación' : 'Aprobación automática'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {spaceToView.allowRecurring ? 'Permite reservas recurrentes' : 'Solo reservas únicas'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailModalOpen(false)
                    router.push(`/spaces/${spaceToView.id}`)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles Completos
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailModalOpen(false)
                      setSpaceToEdit(spaceToView)
                      setEditModalOpen(true)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailModalOpen(false)
                      router.push(`/spaces/${spaceToView.id}/availability`)
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Disponibilidad
                  </Button>
                  <Button onClick={() => setDetailModalOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Space Modal */}
      <AddSpaceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Edit Space Modal */}
      <EditSpaceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        space={spaceToEdit}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}