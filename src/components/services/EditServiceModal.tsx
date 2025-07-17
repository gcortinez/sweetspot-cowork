'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  Loader2, 
  Settings, 
  DollarSign, 
  Package,
  Save,
  X,
  Plus,
  Tag,
  Edit
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// Removed direct server action import to avoid client/server component conflicts

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
  maxQuantity?: number
  minimumOrder?: number
  requiresApproval: boolean
  estimatedDeliveryTime?: string
  instructions?: string
  dynamicPricing: boolean
  pricingTiers: any[]
  metadata: any
  tags: string[]
}

interface EditServiceModalProps {
  service: Service
  isOpen: boolean
  onClose: () => void
  onServiceUpdated: () => void
}

interface PricingTier {
  minQuantity: number
  price?: number
  discount?: number
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED' | 'TIER_PRICE'
}

const SERVICE_CATEGORIES = [
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

const SERVICE_TYPES = [
  { value: 'CONSUMABLE', label: 'Consumible', description: 'Artículos físicos que se consumen' },
  { value: 'SUBSCRIPTION', label: 'Suscripción', description: 'Servicios recurrentes' },
  { value: 'ON_DEMAND', label: 'Bajo Demanda', description: 'Servicios solicitados según necesidad' },
  { value: 'APPOINTMENT', label: 'Cita', description: 'Servicios programados' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'ALWAYS', label: '24/7', description: 'Disponible las 24 horas' },
  { value: 'BUSINESS_HOURS', label: 'Horario Laboral', description: 'Disponible en horario de oficina' },
  { value: 'SCHEDULED', label: 'Programado', description: 'Disponible en horarios específicos' },
]

const COMMON_UNITS = [
  'unit', 'hour', 'day', 'week', 'month', 'year', 'page', 'piece', 'session', 'visit'
]

export default function EditServiceModal({ service, isOpen, onClose, onServiceUpdated }: EditServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    serviceType: '',
    price: '',
    unit: 'unit',
    availability: 'BUSINESS_HOURS',
    maxQuantity: '',
    minimumOrder: '1',
    requiresApproval: false,
    estimatedDeliveryTime: '',
    instructions: '',
    dynamicPricing: false,
    isActive: true,
  })

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Load service data when modal opens
  useEffect(() => {
    if (isOpen && service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category,
        serviceType: service.serviceType,
        price: service.price.toString(),
        unit: service.unit,
        availability: service.availability,
        maxQuantity: service.maxQuantity ? service.maxQuantity.toString() : '',
        minimumOrder: service.minimumOrder ? service.minimumOrder.toString() : '1',
        requiresApproval: service.requiresApproval,
        estimatedDeliveryTime: service.estimatedDeliveryTime || '',
        instructions: service.instructions || '',
        dynamicPricing: service.dynamicPricing,
        isActive: service.isActive,
      })
      
      setPricingTiers(Array.isArray(service.pricingTiers) ? service.pricingTiers : [])
      setTags(Array.isArray(service.tags) ? service.tags : [])
    }
  }, [isOpen, service])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddPricingTier = () => {
    setPricingTiers(prev => [...prev, {
      minQuantity: 1,
      discountType: 'NONE',
    }])
  }

  const handleRemovePricingTier = (index: number) => {
    setPricingTiers(prev => prev.filter((_, i) => i !== index))
  }

  const handlePricingTierChange = (index: number, field: string, value: any) => {
    setPricingTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category || !formData.serviceType || !formData.price) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const serviceData = {
        id: service.id,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        serviceType: formData.serviceType,
        price: parseFloat(formData.price),
        unit: formData.unit,
        availability: formData.availability,
        maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
        minimumOrder: parseInt(formData.minimumOrder),
        requiresApproval: formData.requiresApproval,
        estimatedDeliveryTime: formData.estimatedDeliveryTime || undefined,
        instructions: formData.instructions || undefined,
        dynamicPricing: formData.dynamicPricing,
        isActive: formData.isActive,
        pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
        tags: tags.length > 0 ? tags : undefined,
        metadata: {
          ...service.metadata,
          lastUpdated: new Date().toISOString(),
          updatedVia: 'admin-panel',
        },
      }

      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Servicio actualizado",
          description: "El servicio ha sido actualizado exitosamente",
          duration: 3000,
        })
        onServiceUpdated()
      } else {
        setErrors(result.fieldErrors || {})
        toast({
          title: "Error al actualizar servicio",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating service:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el servicio",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewTag('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Edit className="h-4 w-4 text-white" />
            </div>
            Editar Servicio
          </DialogTitle>
          <DialogDescription>
            Modifica la información del servicio "{service?.name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Servicio <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Impresión B&N, Oficina Virtual"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe qué incluye este servicio..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de Servicio <span className="text-red-500">*</span></Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Disponibilidad</Label>
                  <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona disponibilidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Precios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuración de Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Base <span className="text-red-500">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="10000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumOrder">Orden Mínima</Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    value={formData.minimumOrder}
                    onChange={(e) => handleInputChange('minimumOrder', e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <Label>Niveles de Precio</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPricingTier}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Nivel
                  </Button>
                </div>

                {pricingTiers.map((tier, index) => (
                  <div key={index} className="p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Nivel {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePricingTier(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Cantidad Mínima</Label>
                        <Input
                          type="number"
                          value={tier.minQuantity}
                          onChange={(e) => handlePricingTierChange(index, 'minQuantity', parseInt(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tipo de Descuento</Label>
                        <Select
                          value={tier.discountType}
                          onValueChange={(value) => handlePricingTierChange(index, 'discountType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sin Descuento</SelectItem>
                            <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                            <SelectItem value="FIXED">Monto Fijo</SelectItem>
                            <SelectItem value="TIER_PRICE">Precio Específico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {tier.discountType === 'TIER_PRICE' && (
                        <div>
                          <Label className="text-xs">Precio</Label>
                          <Input
                            type="number"
                            value={tier.price || ''}
                            onChange={(e) => handlePricingTierChange(index, 'price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                      {(tier.discountType === 'PERCENTAGE' || tier.discountType === 'FIXED') && (
                        <div>
                          <Label className="text-xs">
                            {tier.discountType === 'PERCENTAGE' ? 'Descuento (%)' : 'Descuento ($)'}
                          </Label>
                          <Input
                            type="number"
                            value={tier.discount || ''}
                            onChange={(e) => handlePricingTierChange(index, 'discount', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuración Avanzada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxQuantity">Cantidad Máxima (opcional)</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => handleInputChange('maxQuantity', e.target.value)}
                    placeholder="Sin límite"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryTime">Tiempo de Entrega</Label>
                  <Input
                    id="estimatedDeliveryTime"
                    value={formData.estimatedDeliveryTime}
                    onChange={(e) => handleInputChange('estimatedDeliveryTime', e.target.value)}
                    placeholder="Ej: 2 horas, Inmediato"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Instrucciones especiales para el servicio..."
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <Label>Etiquetas</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Agregar etiqueta"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Switches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requiere Aprobación</Label>
                    <p className="text-sm text-muted-foreground">
                      Los pedidos necesitan aprobación antes de ser procesados
                    </p>
                  </div>
                  <Switch
                    checked={formData.requiresApproval}
                    onCheckedChange={(checked) => handleInputChange('requiresApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Precios Dinámicos</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir ajustes de precio en tiempo real
                    </p>
                  </div>
                  <Switch
                    checked={formData.dynamicPricing}
                    onCheckedChange={(checked) => handleInputChange('dynamicPricing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Servicio Activo</Label>
                    <p className="text-sm text-muted-foreground">
                      El servicio estará disponible para cotizaciones
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}