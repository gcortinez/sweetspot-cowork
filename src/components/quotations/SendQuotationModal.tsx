'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Mail, 
  Loader2, 
  Send,
  User,
  FileText,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Quotation {
  id: string
  number: string
  title: string
  total: number
  currency: string
  client: {
    id: string
    name: string
    email: string
  }
  opportunity?: {
    id: string
    title: string
  }
}

interface SendQuotationModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
  onEmailSent: () => void
}

export default function SendQuotationModal({ 
  quotation, 
  isOpen, 
  onClose,
  onEmailSent
}: SendQuotationModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Set default values when modal opens
  React.useEffect(() => {
    if (isOpen && quotation) {
      setFormData({
        email: quotation.client?.email || '',
        subject: `Cotización ${quotation.number} - ${quotation.title}`,
        message: `Estimado/a ${quotation.client?.name || 'Cliente'},

Adjunto encontrará la cotización ${quotation.number} por un valor de $${quotation.total.toLocaleString()} ${quotation.currency}.

Esta cotización incluye todos los detalles de los servicios solicitados.

Si tiene alguna pregunta o necesita aclaraciones, no dude en contactarnos.

Saludos cordiales,
El equipo de SweetSpot Cowork`
      })
    }
  }, [isOpen, quotation])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quotation) return
    
    if (!formData.email || !formData.subject) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el email y el asunto",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/quotations/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Cotización enviada",
          description: `La cotización ha sido enviada a ${formData.email}`,
          duration: 3000,
        })
        onEmailSent()
        onClose()
      } else {
        toast({
          title: "Error al enviar",
          description: result.error || "Error al enviar la cotización",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending quotation:', error)
      toast({
        title: "Error",
        description: "Error al enviar la cotización",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ email: '', subject: '', message: '' })
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!quotation) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Send className="h-4 w-4 text-white" />
            </div>
            Enviar Cotización por Email
          </DialogTitle>
          <DialogDescription>
            Envía la cotización {quotation.number} por correo electrónico
          </DialogDescription>
        </DialogHeader>

        {/* Quotation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumen de la Cotización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <div className="font-medium">{quotation.number}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <div className="font-medium">{formatCurrency(quotation.total)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <div className="font-medium">{quotation.client?.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Email del cliente:</span>
                <div className="font-medium">{quotation.client?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Email Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información del Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de destino <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="cliente@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto <span className="text-red-500">*</span></Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Asunto del correo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje personalizado</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Mensaje que acompañará la cotización..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Este mensaje aparecerá en el cuerpo del email junto con la cotización en PDF adjunta.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">¿Qué incluye el envío?</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>PDF de la cotización con todos los detalles</li>
                <li>Logo y información de contacto del cowork</li>
                <li>Mensaje personalizado que escribas arriba</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.email || !formData.subject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Cotización
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}