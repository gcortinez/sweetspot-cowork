'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Loader2, 
  FileText, 
  DollarSign, 
  Calendar,
  User,
  Building2,
  Calculator,
  Sparkles,
  AlertCircle,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createQuotationAction } from '@/lib/actions/quotations'
import { useApi } from '@/hooks/use-api'
import ServiceSelector from '@/components/services/ServiceSelector'

interface CreateQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onQuotationCreated: () => void
  opportunityId?: string
  clientId?: string
  leadId?: string
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

const initialFormData = {
  title: '',
  description: '',
  clientId: '',
  validUntil: '',
  discountType: 'FIXED' as 'FIXED' | 'PERCENTAGE',
  discountValue: 0,
  currency: 'CLP',
  notes: '',
}

export default function CreateQuotationModal({ 
  isOpen, 
  onClose, 
  onQuotationCreated, 
  opportunityId,
  clientId,
  leadId 
}: CreateQuotationModalProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const api = useApi()
  
  // State for lazy-loaded clients
  const [clients, setClients] = useState<any[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [preselectedClient, setPreselectedClient] = useState<any>(null)
  const [isLoadingPreselectedClient, setIsLoadingPreselectedClient] = useState(false)

  // Load clients only when modal is opened
  const loadClients = async () => {
    if (clients.length > 0) return // Already loaded
    
    try {
      setIsLoadingClients(true)
      const response = await api.get('/api/clients')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setClients(result.clients || [])
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  // Load clients when modal opens
  React.useEffect(() => {
    if (isOpen && !clientId) {
      loadClients()
    }
  }, [isOpen, clientId])

  // Calculate totals with automatic IVA
  const subtotal = selectedServices.reduce((sum, service) => sum + service.total, 0)

  // Calculate discount amount based on type
  const discountAmount = formData.discountType === 'PERCENTAGE'
    ? (subtotal * formData.discountValue) / 100
    : formData.discountValue

  // Calculate taxable amount (subtotal - discount)
  const taxableAmount = Math.max(0, subtotal - discountAmount)

  // Calculate IVA (19% of taxable amount)
  const taxes = taxableAmount * 0.19

  // Calculate total
  const total = subtotal - discountAmount + taxes

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.clientId || !formData.validUntil) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Servicios requeridos",
        description: "Debes agregar al menos un servicio a la cotización",
        variant: "destructive",
      })
      return
    }

    // Validate valid until date is in the future
    const validUntilDate = new Date(formData.validUntil)
    if (validUntilDate <= new Date()) {
      toast({
        title: "Fecha inválida",
        description: "La fecha de validez debe ser futura",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const quotationData = {
        clientId: formData.clientId,
        opportunityId,
        leadId,
        title: formData.title,
        description: formData.description || undefined,
        items: selectedServices.map(service => ({
          description: service.description,
          quantity: parseInt(service.quantity.toString()) || 1,
          unitPrice: parseFloat(service.unitPrice.toString()) || 0,
          total: parseFloat(service.total.toString()) || 0,
        })),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        currency: formData.currency,
        validUntil: formData.validUntil,
        notes: formData.notes || undefined,
      }

      const result = await createQuotationAction(quotationData)
      
      if (result.success) {
        toast({
          title: "Cotización creada",
          description: "La cotización ha sido creada exitosamente",
          duration: 3000,
        })
        onQuotationCreated()
        resetForm()
      } else {
        toast({
          title: "Error al crear cotización",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating quotation:', error)
      toast({
        title: "Error",
        description: "Error al crear la cotización",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setSelectedServices([])
    setPreselectedClient(null)
    setIsLoadingPreselectedClient(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Set default client if provided and reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (clientId) {
        setFormData(prev => ({ ...prev, clientId }))
        // Load preselected client info
        loadPreselectedClient()
      } else {
        // Reset client selection if no specific client is provided
        setFormData(prev => ({ ...prev, clientId: '' }))
        setPreselectedClient(null)
      }
    }
  }, [isOpen, clientId])

  // Load preselected client information
  const loadPreselectedClient = async () => {
    if (!clientId) return
    
    setIsLoadingPreselectedClient(true)
    try {
      const response = await api.get(`/api/clients`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const clientData = result.clients?.find((client: any) => client.id === clientId)
          if (clientData) {
            setPreselectedClient(clientData)
          }
        }
      }
    } catch (error) {
      console.error('Error loading preselected client:', error)
    } finally {
      setIsLoadingPreselectedClient(false)
    }
  }

  // Set default valid until date (30 days from now)
  React.useEffect(() => {
    if (isOpen && !formData.validUntil) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setFormData(prev => ({ 
        ...prev, 
        validUntil: futureDate.toISOString().split('T')[0] 
      }))
    }
  }, [isOpen, formData.validUntil])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Crear Nueva Cotización
          </DialogTitle>
          <DialogDescription>
            Crea una nueva cotización seleccionando servicios y configurando los detalles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la Cotización <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Paquete Oficina Virtual Premium"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente <span className="text-red-500">*</span></Label>
                  {clientId && isLoadingPreselectedClient ? (
                    // Show loading spinner while loading preselected client
                    <div className="relative">
                      <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="text-gray-500">Cargando cliente...</span>
                      </div>
                    </div>
                  ) : clientId && preselectedClient ? (
                    // Show preselected client as disabled input
                    <div className="relative">
                      <Input
                        value={preselectedClient.name}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    // Show client selector
                    <Select 
                      value={formData.clientId} 
                      onValueChange={(value) => handleInputChange('clientId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClients ? (
                          <SelectItem value="loading" disabled>
                            Cargando clientes...
                          </SelectItem>
                        ) : (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{client.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {client.company || client.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  )}
                  {clientId && preselectedClient && (
                    <p className="text-xs text-muted-foreground">
                      Cliente preseleccionado de la oportunidad
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Texto libre para la propuesta</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Agrega información adicional, términos especiales, o cualquier nota que quieras incluir en la propuesta..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este texto aparecerá en el PDF de la cotización que se envía al cliente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Válida hasta <span className="text-red-500">*</span></Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border rounded-md">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">CLP - Peso Chileno</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Total Estimado</Label>
                  <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border rounded-md">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ${total.toLocaleString()} {formData.currency}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Servicios */}
          <ServiceSelector
            selectedServices={selectedServices}
            onSelectionChange={setSelectedServices}
          />

          {/* Descuentos y Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Descuentos y Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipo de Descuento</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'FIXED' | 'PERCENTAGE') => handleInputChange('discountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Monto Fijo (CLP)</SelectItem>
                      <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Valor del Descuento {formData.discountType === 'PERCENTAGE' ? '(%)' : `(${formData.currency})`}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                    step={formData.discountType === 'PERCENTAGE' ? '0.01' : '1'}
                  />
                </div>
              </div>

              <Separator />

              {/* Resumen de Totales */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="font-medium">${subtotal.toLocaleString()} {formData.currency}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>
                      Descuentos
                      {formData.discountType === 'PERCENTAGE' && ` (${formData.discountValue}%)`}:
                    </span>
                    <span>-${Math.round(discountAmount).toLocaleString()} {formData.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-orange-600">
                  <span>Impuestos (IVA 19%):</span>
                  <span>+${Math.round(taxes).toLocaleString()} {formData.currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">${Math.round(total).toLocaleString()} {formData.currency}</span>
                </div>
              </div>

              {discountAmount > subtotal && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 text-sm">
                    El descuento no puede ser mayor al subtotal.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notas adicionales sobre esta cotización..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Estas notas son para uso interno y no aparecerán en la cotización final.
                </p>
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
              disabled={isSubmitting || selectedServices.length === 0 || discountAmount > subtotal}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Cotización
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}