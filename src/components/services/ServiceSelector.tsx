'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Search, 
  Package, 
  DollarSign,
  Clock,
  Info,
  X,
  Check,
  ShoppingCart,
  Calculator
} from "lucide-react"
import { getServicesByCategoryAction } from '@/lib/actions/service'
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: string
  name: string
  description: string
  category: string
  serviceType: string
  price: number
  unit: string
  availability: string
  pricingTiers: PricingTier[]
  metadata: any
  tags: string[]
}

interface PricingTier {
  minQuantity: number
  price?: number
  discount?: number
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED' | 'TIER_PRICE'
}

interface SelectedService {
  serviceId: string
  serviceName: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  metadata?: any
}

interface ServiceSelectorProps {
  selectedServices: SelectedService[]
  onSelectionChange: (services: SelectedService[]) => void
  className?: string
}

const SERVICE_CATEGORIES = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'PRINTING', label: 'Impresión' },
  { value: 'COFFEE', label: 'Café' },
  { value: 'FOOD', label: 'Comida' },
  { value: 'PARKING', label: 'Estacionamiento' },
  { value: 'STORAGE', label: 'Almacenamiento' },
  { value: 'MAIL', label: 'Correo' },
  { value: 'PHONE', label: 'Teléfono' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'BUSINESS_SUPPORT', label: 'Soporte Empresarial' },
  { value: 'EVENT_SERVICES', label: 'Servicios de Eventos' },
  { value: 'WELLNESS', label: 'Bienestar' },
  { value: 'TRANSPORTATION', label: 'Transporte' },
  { value: 'CONSULTING', label: 'Consultoría' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
]

export default function ServiceSelector({ selectedServices, onSelectionChange, className }: ServiceSelectorProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedServiceForAdd, setSelectedServiceForAdd] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState('')
  const { toast } = useToast()

  // Load available services
  const loadServices = async () => {
    try {
      setIsLoading(true)
      const category = selectedCategory === 'all' ? undefined : selectedCategory
      const result = await getServicesByCategoryAction(category)
      
      if (result.success) {
        setAvailableServices(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar los servicios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast({
        title: "Error",
        description: "Error al cargar los servicios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate price based on quantity and pricing tiers
  const calculatePrice = (service: Service, quantity: number): number => {
    if (service.pricingTiers && service.pricingTiers.length > 0) {
      // Find applicable tier
      const applicableTier = service.pricingTiers
        .filter(tier => tier.minQuantity <= quantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0]

      if (applicableTier) {
        if (applicableTier.discountType === 'TIER_PRICE' && applicableTier.price) {
          return applicableTier.price
        } else if (applicableTier.discountType === 'PERCENTAGE' && applicableTier.discount) {
          return service.price * (1 - applicableTier.discount / 100)
        } else if (applicableTier.discountType === 'FIXED' && applicableTier.discount) {
          return Math.max(0, service.price - applicableTier.discount)
        }
      }
    }
    
    return service.price
  }

  // Filter services based on search and category
  const filteredServices = availableServices.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    
    // Don't show already selected services
    const isNotSelected = !selectedServices.some(selected => selected.serviceId === service.id)
    
    return matchesSearch && matchesCategory && isNotSelected
  })

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedServiceForAdd(service)
    setQuantity(1)
    setCustomPrice('')
    setShowAddForm(true)
  }

  // Add service to selection
  const handleAddService = () => {
    if (!selectedServiceForAdd) return
    
    const unitPrice = customPrice ? parseFloat(customPrice) : calculatePrice(selectedServiceForAdd, quantity)
    const total = unitPrice * quantity
    
    const newService: SelectedService = {
      serviceId: selectedServiceForAdd.id,
      serviceName: selectedServiceForAdd.name,
      description: selectedServiceForAdd.description,
      quantity: quantity,
      unitPrice: unitPrice,
      total: total,
      metadata: {
        originalPrice: selectedServiceForAdd.price,
        unit: selectedServiceForAdd.unit,
        category: selectedServiceForAdd.category,
        serviceType: selectedServiceForAdd.serviceType,
        customPriceApplied: !!customPrice,
      }
    }
    
    onSelectionChange([...selectedServices, newService])
    setShowAddForm(false)
    setSelectedServiceForAdd(null)
    
    toast({
      title: "Servicio agregado",
      description: `${selectedServiceForAdd.name} ha sido agregado a la cotización`,
      duration: 2000,
    })
  }

  // Remove service from selection
  const handleRemoveService = (serviceId: string) => {
    const updatedServices = selectedServices.filter(service => service.serviceId !== serviceId)
    onSelectionChange(updatedServices)
  }

  // Update service quantity or price
  const handleUpdateService = (serviceId: string, field: 'quantity' | 'unitPrice', value: number) => {
    const updatedServices = selectedServices.map(service => {
      if (service.serviceId === serviceId) {
        const updatedService = { ...service, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedService.total = updatedService.quantity * updatedService.unitPrice
        }
        return updatedService
      }
      return service
    })
    onSelectionChange(updatedServices)
  }

  // Calculate totals
  const subtotal = selectedServices.reduce((sum, service) => sum + service.total, 0)

  useEffect(() => {
    loadServices()
  }, [selectedCategory])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Service Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Catálogo de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Cargando servicios...
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No se encontraron servicios disponibles
              </div>
            ) : (
              filteredServices.map(service => (
                <Card key={service.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{service.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {service.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">
                            ${service.price.toLocaleString()} / {service.unit}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectService(service)}
                          className="h-7 px-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {service.pricingTiers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {service.pricingTiers.length} nivel{service.pricingTiers.length > 1 ? 'es' : ''} de precio
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Service Form */}
      {showAddForm && selectedServiceForAdd && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar: {selectedServiceForAdd.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPrice">Precio Personalizado (opcional)</Label>
                <Input
                  id="customPrice"
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`Precio base: $${selectedServiceForAdd.price.toLocaleString()}`}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <div className="flex items-center gap-2 h-10 px-3 bg-white border rounded-md">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    ${((customPrice ? parseFloat(customPrice) : calculatePrice(selectedServiceForAdd, quantity)) * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Pricing Tiers Info */}
            {selectedServiceForAdd.pricingTiers.length > 0 && !customPrice && (
              <div className="p-3 bg-white rounded-md border">
                <Label className="text-sm font-medium mb-2 block">Niveles de Precio Disponibles:</Label>
                <div className="space-y-1">
                  {selectedServiceForAdd.pricingTiers.map((tier, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      • {tier.minQuantity}+ unidades: {
                        tier.discountType === 'TIER_PRICE' ? `$${tier.price?.toLocaleString()}` :
                        tier.discountType === 'PERCENTAGE' ? `${tier.discount}% desc.` :
                        tier.discountType === 'FIXED' ? `$${tier.discount} desc.` :
                        'Sin descuento'
                      }
                      {tier.minQuantity <= quantity && (
                        <Badge variant="secondary" className="ml-2 text-xs">Aplicado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddService}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Servicio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Servicios Seleccionados ({selectedServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios seleccionados
            </div>
          ) : (
            <div className="space-y-4">
              {selectedServices.map((service, index) => (
                <Card key={`${service.serviceId}-${index}`} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{service.serviceName}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                        {service.metadata?.customPriceApplied && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Precio personalizado
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveService(service.serviceId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          value={service.quantity}
                          onChange={(e) => handleUpdateService(service.serviceId, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Precio Unitario</Label>
                        <Input
                          type="number"
                          value={service.unitPrice}
                          onChange={(e) => handleUpdateService(service.serviceId, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unidad</Label>
                        <div className="h-8 flex items-center text-sm text-muted-foreground">
                          {service.metadata?.unit || 'unit'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total</Label>
                        <div className="h-8 flex items-center font-semibold">
                          ${service.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Subtotal */}
              <Separator />
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}