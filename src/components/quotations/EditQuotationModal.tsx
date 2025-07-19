'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Calendar,
  Calculator,
  Edit,
  AlertCircle,
  Info,
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateQuotationAction } from '@/lib/actions/quotations'
import ServiceSelector from '@/components/services/ServiceSelector'

interface Quotation {
  id: string
  number: string
  title: string
  description?: string
  subtotal: number
  discounts: number
  taxes: number
  total: number
  currency: string
  validUntil: string
  status: string
  notes?: string
  items: QuotationItem[]
  clientId: string
  opportunityId?: string
  leadId?: string
}

interface QuotationItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface EditQuotationModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
  onQuotationUpdated: () => void
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

export default function EditQuotationModal({ 
  quotation,
  isOpen, 
  onClose, 
  onQuotationUpdated
}: EditQuotationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    validUntil: '',
    discounts: 0,
    taxes: 0,
    currency: 'CLP',
    notes: '',
  })
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingAndClosing, setIsSubmittingAndClosing] = useState(false)
  const { toast } = useToast()

  // Load quotation data when modal opens
  useEffect(() => {
    if (isOpen && quotation) {
      setFormData({
        title: quotation.title,
        description: quotation.description || '',
        validUntil: quotation.validUntil.split('T')[0], // Convert to date input format
        discounts: quotation.discounts,
        taxes: quotation.taxes,
        currency: quotation.currency,
        notes: quotation.notes || '',
      })

      // Convert quotation items to selected services format with proper number conversion
      const services: SelectedService[] = quotation.items.map((item, index) => ({
        serviceId: item.id ? `existing-${item.id}` : `temp-${quotation.id}-${index}`,
        serviceName: item.description,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        metadata: {
          originalItemId: item.id,
          isExisting: !!item.id
        }
      }))
      setSelectedServices(services)
    }
  }, [isOpen, quotation])

  // Calculate totals with proper number conversion
  const subtotal = selectedServices.reduce((sum, service) => {
    // Ensure we're working with proper numbers, not Decimal objects
    const serviceTotal = typeof service.total === 'number' ? service.total : parseFloat(service.total?.toString() || '0')
    return sum + serviceTotal
  }, 0)
  const total = subtotal - (formData.discounts || 0) + (formData.taxes || 0)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await performSave(false)
  }

  const handleSaveAndClose = async (e: React.FormEvent) => {
    e.preventDefault()
    await performSave(true)
  }

  const performSave = async (shouldClose: boolean) => {
    if (!quotation) return
    
    if (!formData.title || !formData.validUntil) {
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

    if (shouldClose) {
      setIsSubmittingAndClosing(true)
    } else {
      setIsSubmitting(true)
    }
    
    try {
      const quotationData = {
        id: quotation.id,
        title: formData.title,
        description: formData.description || undefined,
        items: selectedServices.map(service => ({
          description: service.description,
          quantity: Number(service.quantity),
          unitPrice: Number(service.unitPrice),
          total: Number(service.total),
        })),
        discounts: formData.discounts,
        taxes: formData.taxes,
        currency: formData.currency,
        validUntil: formData.validUntil,
        notes: formData.notes || undefined,
      }

      console.log('🐛 Frontend - Sending quotationData:', JSON.stringify(quotationData, null, 2))
      console.log('🐛 Frontend - selectedServices before conversion:', selectedServices)

      const result = await updateQuotationAction(quotationData)
      
      if (result.success) {
        toast({
          title: "Cotización actualizada",
          description: "La cotización ha sido actualizada exitosamente",
          duration: 3000,
        })
        
        // Only update local state if we're not closing the modal
        if (!shouldClose && result.data) {
          // Update form data with server response
          setFormData({
            title: result.data.title || '',
            description: result.data.description || '',
            discounts: result.data.discounts || 0,
            taxes: result.data.taxes || 0,
            currency: result.data.currency || 'CLP',
            validUntil: result.data.validUntil ? result.data.validUntil.split('T')[0] : '',
            notes: result.data.notes || '',
          })
          
          // Update selected services with fresh data maintaining consistent IDs
          if (result.data.items) {
            const updatedServices: SelectedService[] = result.data.items.map((item: any, index: number) => ({
              serviceId: item.id ? `existing-${item.id}` : `temp-${result.data.id}-${index}`,
              serviceName: item.description,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              total: Number(item.total),
              metadata: {
                originalItemId: item.id,
                isExisting: !!item.id
              }
            }))
            setSelectedServices(updatedServices)
          }
        }
        
        // Notify parent to update the list
        onQuotationUpdated()
        
        // Close modal only if requested
        if (shouldClose) {
          onClose()
        }
      } else {
        toast({
          title: "Error al actualizar cotización",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating quotation:', error)
      toast({
        title: "Error",
        description: "Error al actualizar la cotización",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsSubmittingAndClosing(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!quotation) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Edit className="h-4 w-4 text-white" />
            </div>
            Editar Cotización
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de la cotización {quotation.number}. Solo se pueden editar cotizaciones en estado borrador.
          </DialogDescription>
        </DialogHeader>

        {quotation.status !== 'DRAFT' ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-700">
                  Esta cotización no se puede editar porque su estado es: <strong>{quotation.status}</strong>. 
                  Solo las cotizaciones en estado BORRADOR pueden ser editadas.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="number">Número de Cotización</Label>
                    <Input
                      id="number"
                      value={quotation.number}
                      disabled
                      className="bg-gray-50"
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || isSubmittingAndClosing || selectedServices.length === 0 || total < 0}
                variant="secondary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveAndClose}
                disabled={isSubmitting || isSubmittingAndClosing || selectedServices.length === 0 || total < 0}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {isSubmittingAndClosing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando y cerrando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar y Cerrar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}