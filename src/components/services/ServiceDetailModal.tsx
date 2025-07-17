'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Edit,
  Package,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
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
  maxQuantity?: number
  minimumOrder?: number
}

interface ServiceDetailModalProps {
  service: Service | null
  isOpen: boolean
  onClose: () => void
  onEdit: (service: Service) => void
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

export default function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  onEdit
}: ServiceDetailModalProps) {
  if (!service) return null

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Package className="h-5 w-5" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCategoryIcon(service.category)}
              <span>{service.name}</span>
            </div>
            <Button
              onClick={() => onEdit(service)}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="mt-1 text-gray-900">{service.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getCategoryColor(service.category)} flex items-center gap-1`}>
                    {getCategoryIcon(service.category)}
                    {service.category.replace('_', ' ')}
                  </Badge>
                  <Badge className={getServiceTypeColor(service.serviceType)}>
                    {SERVICE_TYPE_LABELS[service.serviceType as keyof typeof SERVICE_TYPE_LABELS] || service.serviceType}
                  </Badge>
                  <Badge className={getAvailabilityColor(service.availability)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {AVAILABILITY_LABELS[service.availability as keyof typeof AVAILABILITY_LABELS] || service.availability}
                  </Badge>
                  <Badge className={service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {service.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Precio Base</label>
                  <div className="mt-1 flex items-center text-xl font-bold text-green-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {formatPrice(service.price, service.unit)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.maxQuantity && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cantidad Máxima</label>
                    <p className="mt-1 text-gray-900">{service.maxQuantity}</p>
                  </div>
                )}

                {service.minimumOrder && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pedido Mínimo</label>
                    <p className="mt-1 text-gray-900">{service.minimumOrder}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(service.createdAt)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(service.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Niveles de precio */}
          {service.pricingTiers && service.pricingTiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Niveles de Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.pricingTiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tier.minQuantity}+ unidades</Badge>
                        <span className="text-sm text-gray-600">
                          {tier.discountType === 'TIER_PRICE' && tier.price && 
                            `Precio: $${tier.price.toLocaleString()}`
                          }
                          {tier.discountType === 'PERCENTAGE' && tier.discount && 
                            `${tier.discount}% de descuento`
                          }
                          {tier.discountType === 'FIXED' && tier.discount && 
                            `$${tier.discount.toLocaleString()} de descuento`
                          }
                          {tier.discountType === 'NONE' && 'Sin descuento'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etiquetas */}
          {service.tags && service.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadatos */}
          {service.metadata && Object.keys(service.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Adicional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(service.metadata).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="mt-1">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside text-gray-900">
                            {value.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-900">{String(value)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}