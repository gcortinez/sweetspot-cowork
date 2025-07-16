'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  onDelete: (serviceId: string) => void
  categoryIcons: Record<string, React.ComponentType<{ className?: string }>>
  categoryColors: Record<string, string>
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

export default function ServicesTable({ 
  services, 
  onEdit, 
  onDelete, 
  categoryIcons, 
  categoryColors 
}: ServicesTableProps) {
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
    const IconComponent = categoryIcons[category]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Package className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || 'bg-gray-100 text-gray-800'
  }

  const getServiceTypeColor = (serviceType: string) => {
    return SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const getAvailabilityColor = (availability: string) => {
    return AVAILABILITY_COLORS[availability as keyof typeof AVAILABILITY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = (serviceId: string, serviceName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${serviceName}"?`)) {
      onDelete(serviceId)
    }
  }

  if (services.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No hay servicios disponibles
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea tu primer servicio para comenzar
          </p>
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
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">
                <div className="space-y-1">
                  <div className="font-semibold">{service.name}</div>
                  {service.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </div>
                  )}
                  {service.tags && service.tags.length > 0 && (
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
                {service.pricingTiers && service.pricingTiers.length > 0 && (
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
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(service.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(service)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(service.id, service.name)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}