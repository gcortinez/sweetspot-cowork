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
  discounts: 0,
  taxes: 0,
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

  // Load clients only when modal is opened
  const loadClients = async () => {
    if (clients.length > 0) return // Already loaded
    
    try {
      setIsLoadingClients(true)
      const response = await api.get('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
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

  // Calculate totals
  const subtotal = selectedServices.reduce((sum, service) => sum + service.total, 0)
  const total = subtotal - formData.discounts + formData.taxes

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
          quantity: service.quantity,
          unitPrice: service.unitPrice,
          total: service.total,
        })),
        discounts: formData.discounts,
        taxes: formData.taxes,
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
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Set default client if provided
  React.useEffect(() => {
    if (clientId && formData.clientId !== clientId) {
      setFormData(prev => ({ ...prev, clientId }))
    }
  }, [clientId, formData.clientId])

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
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(value) => handleInputChange('clientId', value)}
                    disabled={!!clientId}
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe brevemente esta cotización..."
                  rows={3}
                />
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
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discounts">Descuentos ({formData.currency})</Label>
                  <Input
                    id="discounts"
                    type="number"
                    value={formData.discounts}
                    onChange={(e) => handleInputChange('discounts', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxes">Impuestos ({formData.currency})</Label>
                  <Input
                    id="taxes"
                    type="number"
                    value={formData.taxes}
                    onChange={(e) => handleInputChange('taxes', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
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
                {formData.discounts > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Descuentos:</span>
                    <span>-${formData.discounts.toLocaleString()} {formData.currency}</span>
                  </div>
                )}
                {formData.taxes > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span>Impuestos:</span>
                    <span>+${formData.taxes.toLocaleString()} {formData.currency}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">${total.toLocaleString()} {formData.currency}</span>
                </div>
              </div>

              {total < 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 text-sm">
                    El total no puede ser negativo. Ajusta los descuentos.
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
              disabled={isSubmitting || selectedServices.length === 0 || total < 0}
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