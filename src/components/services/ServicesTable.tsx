'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  DollarSign,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Printer,
  Car,
  Mail,
  Phone,
  Users,
  Wrench,
  Globe,
  Settings,
  Building2,
  Activity,
  Plus,
  Loader2,
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  category: string
  serviceType: string
  price: number
  unit: string
  availability: string
  isActive: boolean
  pricingTiers: any[]
  metadata: any
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ServicesTableProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => Promise<void>
  onDetail?: (service: Service) => void
  isLoading?: boolean
  isFiltering?: boolean
  onCreateService?: () => void
  onCreatePredefined?: () => void
  isCreatingPredefined?: boolean
  deletingServiceId?: string | null
}

const SERVICE_TYPE_LABELS = {
  'CONSUMABLE': 'Consumible',
  'SUBSCRIPTION': 'Suscripción',
  'ON_DEMAND': 'Bajo Demanda',
  'APPOINTMENT': 'Cita',
}

const SERVICE_TYPE_COLORS = {
  'CONSUMABLE': 'bg-blue-100 text-blue-800',
  'SUBSCRIPTION': 'bg-green-100 text-green-800',
  'ON_DEMAND': 'bg-orange-100 text-orange-800',
  'APPOINTMENT': 'bg-purple-100 text-purple-800',
}

const AVAILABILITY_LABELS = {
  'ALWAYS': '24/7',
  'BUSINESS_HOURS': 'Horario Laboral',
  'SCHEDULED': 'Programado',
}

const AVAILABILITY_COLORS = {
  'ALWAYS': 'bg-green-100 text-green-800',
  'BUSINESS_HOURS': 'bg-blue-100 text-blue-800',
  'SCHEDULED': 'bg-orange-100 text-orange-800',
}

const CATEGORY_ICONS = {
  'PRINTING': Printer,
  'COFFEE': Coffee,
  'FOOD': Coffee,
  'PARKING': Car,
  'STORAGE': Package,
  'MAIL': Mail,
  'PHONE': Phone,
  'INTERNET': Globe,
  'CLEANING': Settings,
  'BUSINESS_SUPPORT': Building2,
  'EVENT_SERVICES': Calendar,
  'WELLNESS': Activity,
  'TRANSPORTATION': Car,
  'CONSULTING': Users,
  'MAINTENANCE': Wrench,
}

const CATEGORY_COLORS = {
  'PRINTING': 'bg-blue-100 text-blue-800',
  'COFFEE': 'bg-yellow-100 text-yellow-800',
  'FOOD': 'bg-orange-100 text-orange-800',
  'PARKING': 'bg-purple-100 text-purple-800',
  'STORAGE': 'bg-gray-100 text-gray-800',
  'MAIL': 'bg-green-100 text-green-800',
  'PHONE': 'bg-indigo-100 text-indigo-800',
  'INTERNET': 'bg-cyan-100 text-cyan-800',
  'CLEANING': 'bg-pink-100 text-pink-800',
  'BUSINESS_SUPPORT': 'bg-emerald-100 text-emerald-800',
  'EVENT_SERVICES': 'bg-violet-100 text-violet-800',
  'WELLNESS': 'bg-green-100 text-green-800',
  'TRANSPORTATION': 'bg-blue-100 text-blue-800',
  'CONSULTING': 'bg-slate-100 text-slate-800',
  'MAINTENANCE': 'bg-amber-100 text-amber-800',
}

export default function ServicesTable({ 
  services, 
  onEdit, 
  onDelete, 
  onDetail,
  isLoading = false,
  isFiltering = false,
  onCreateService,
  onCreatePredefined,
  isCreatingPredefined = false,
  deletingServiceId
}: ServicesTableProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    serviceId: string
    serviceName: string
  }>({
    isOpen: false,
    serviceId: '',
    serviceName: ''
  })
  const formatPrice = (price: number, unit: string) => {
    return `$${price.toLocaleString()} / ${unit}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Package className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const getServiceTypeColor = (serviceType: string) => {
    return SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const getAvailabilityColor = (availability: string) => {
    return AVAILABILITY_COLORS[availability as keyof typeof AVAILABILITY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = (serviceId: string, serviceName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      serviceId,
      serviceName
    })
  }

  const confirmDelete = async () => {
    const serviceId = deleteConfirmation.serviceId
    await onDelete(serviceId)
    setDeleteConfirmation({
      isOpen: false,
      serviceId: '',
      serviceName: ''
    })
  }

  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      serviceId: '',
      serviceName: ''
    })
  }

  if (services.length === 0 && !isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No hay servicios disponibles
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primer servicio para comenzar o importa servicios predefinidos
          </p>
          <div className="flex gap-3 justify-center">
            {onCreateService && (
              <Button 
                onClick={onCreateService}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Servicio
              </Button>
            )}
            {onCreatePredefined && (
              <Button 
                onClick={onCreatePredefined}
                variant="outline"
                disabled={isCreatingPredefined}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isCreatingPredefined ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Servicios Predefinidos
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Servicio</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Disponibilidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex items-center justify-center">
                  <Package className="h-8 w-8 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">Cargando servicios...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="text-gray-500">No hay servicios disponibles</div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {isFiltering && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-2 bg-blue-50">
                    <div className="flex items-center justify-center">
                      <Package className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-blue-600 text-sm">Filtrando servicios...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {services.map((service) => (
            <TableRow 
              key={service.id}
              className={onDetail ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onDetail?.(service)}
            >
              <TableCell className="font-medium">
                <div className="space-y-1">
                  <div className="font-semibold">{service.name}</div>
                  {service.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </div>
                  )}
                  {service.tags && Array.isArray(service.tags) && service.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {service.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getCategoryColor(service.category)} flex items-center gap-1 w-fit`}>
                  {getCategoryIcon(service.category)}
                  {service.category.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getServiceTypeColor(service.serviceType)}>
                  {SERVICE_TYPE_LABELS[service.serviceType as keyof typeof SERVICE_TYPE_LABELS] || service.serviceType}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatPrice(service.price, service.unit)}
                  </span>
                </div>
                {service.pricingTiers && Array.isArray(service.pricingTiers) && service.pricingTiers.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {service.pricingTiers.length} nivel{service.pricingTiers.length > 1 ? 'es' : ''} de precio
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getAvailabilityColor(service.availability)}>
                  {AVAILABILITY_LABELS[service.availability as keyof typeof AVAILABILITY_LABELS] || service.availability}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {service.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Activo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">Inactivo</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(service.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={deletingServiceId === service.id}
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    {onDetail && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDetail(service)
                        }}
                        disabled={deletingServiceId === service.id}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => navigator.clipboard.writeText(service.id)}
                      disabled={deletingServiceId === service.id}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(service)
                      }}
                      disabled={deletingServiceId === service.id}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(service.id, service.name)
                      }}
                      className="text-red-600 focus:text-red-600"
                      disabled={deletingServiceId === service.id}
                    >
                      {deletingServiceId === service.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {deletingServiceId === service.id ? 'Eliminando...' : 'Eliminar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
              ))
            }
            </>
          )}
        </TableBody>
      </Table>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Servicio"
        description={`¿Estás seguro de que quieres eliminar el servicio "${deleteConfirmation.serviceName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}