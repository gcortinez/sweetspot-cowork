'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  FileText,
  Clock,
  Package,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Percent,
  Calculator,
  TrendingUp,
  Target,
  Hash,
  Info,
  History
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { useQuotationPDF } from '@/hooks/use-quotation-pdf'
import { generateQuotationPDFAction, emailQuotationPDFAction } from '@/lib/actions/pdf'

interface Quotation {
  id: string
  number: string
  version?: number
  title: string
  description?: string
  subtotal: number
  discounts: number
  taxes: number
  total: number
  currency: string
  validUntil: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
  notes?: string
  terms?: string
  sentAt?: string
  viewedAt?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    contactPerson?: string
    address?: string
  }
  opportunity?: {
    id: string
    title: string
    stage: string
    value: number
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
  }
  items: QuotationItem[]
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  discount?: number
  metadata?: {
    serviceId?: string
    serviceName?: string
    category?: string
    unit?: string
  }
}

interface QuotationDetailModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (quotation: Quotation) => void
  onDelete?: (quotationId: string) => void
  onDuplicate?: (quotation: Quotation) => void
  onStatusChange?: (quotationId: string, status: string) => void
  onSendEmail?: (quotationId: string) => void
  onDownloadPDF?: (quotationId: string) => void
  onViewVersions?: (quotation: Quotation) => void
}

const STATUS_LABELS = {
  'DRAFT': 'Borrador',
  'SENT': 'Enviada',
  'VIEWED': 'Vista',
  'ACCEPTED': 'Aceptada',
  'REJECTED': 'Rechazada',
  'EXPIRED': 'Expirada',
  'CONVERTED': 'Convertida',
}

const STATUS_COLORS = {
  'DRAFT': 'bg-gray-100 text-gray-800',
  'SENT': 'bg-blue-100 text-blue-800',
  'VIEWED': 'bg-purple-100 text-purple-800',
  'ACCEPTED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800',
  'EXPIRED': 'bg-orange-100 text-orange-800',
  'CONVERTED': 'bg-emerald-100 text-emerald-800',
}

const STATUS_ICONS = {
  'DRAFT': Edit,
  'SENT': Send,
  'VIEWED': Eye,
  'ACCEPTED': CheckCircle,
  'REJECTED': XCircle,
  'EXPIRED': AlertCircle,
  'CONVERTED': Package,
}

const NEXT_STATUS_OPTIONS = {
  'DRAFT': ['SENT'],
  'SENT': ['VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  'VIEWED': ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  'ACCEPTED': ['CONVERTED'],
  'REJECTED': ['DRAFT'],
  'EXPIRED': ['DRAFT'],
  'CONVERTED': [],
}

export default function QuotationDetailModal({ 
  quotation, 
  isOpen, 
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onSendEmail,
  onDownloadPDF,
  onViewVersions
}: QuotationDetailModalProps) {
  const { toast } = useToast()
  const { downloadPDF, previewPDF, emailPDF, isGenerating: hookIsGenerating } = useQuotationPDF()
  const [isGenerating, setIsGenerating] = useState(false)
  
  if (!quotation) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: quotation.currency || 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = new Date(quotation.validUntil) < new Date()

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || FileText
    return <IconComponent className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(quotation.number)
    toast({
      title: "Número copiado",
      description: "El número de cotización ha sido copiado al portapapeles",
      duration: 2000,
    })
  }

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cotización ${quotation.number}?`)) {
      onDelete?.(quotation.id)
    }
  }

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      const result = await generateQuotationPDFAction({
        quotationId: quotation.id,
        includeNotes: false,
      })
      
      if (result.success) {
        await downloadPDF(result.data.quotation, result.data.coworkInfo)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al generar PDF",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Error",
        description: "Error al descargar PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreviewPDF = async () => {
    setIsGenerating(true)
    try {
      const result = await generateQuotationPDFAction({
        quotationId: quotation.id,
        includeNotes: false,
      })
      
      if (result.success) {
        await previewPDF(result.data.quotation, result.data.coworkInfo)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al generar PDF",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error previewing PDF:', error)
      toast({
        title: "Error",
        description: "Error al previsualizar PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEmailPDF = async () => {
    setIsGenerating(true)
    try {
      const result = await emailQuotationPDFAction({
        quotationId: quotation.id,
        includeNotes: false,
      })
      
      if (result.success) {
        toast({
          title: "Email enviado",
          description: `PDF enviado a ${result.data.recipientEmail}`,
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error emailing PDF:', error)
      toast({
        title: "Error",
        description: "Error al enviar email",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getClientInfo = () => {
    if (quotation.client) {
      return {
        name: quotation.client.name,
        email: quotation.client.email,
        phone: quotation.client.phone,
        company: quotation.client.company,
        address: quotation.client.address,
        type: 'client'
      }
    } else if (quotation.lead) {
      return {
        name: `${quotation.lead.firstName} ${quotation.lead.lastName}`,
        email: quotation.lead.email,
        phone: quotation.lead.phone,
        company: quotation.lead.company,
        type: 'lead'
      }
    }
    return null
  }

  const clientInfo = getClientInfo()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  {quotation.title}
                  {quotation.version && quotation.version > 1 && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      v{quotation.version}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-normal mt-1 flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  {quotation.number}
                </div>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-4 mt-4">
              <Badge className={`${getStatusColor(quotation.status)} border border-white/20`}>
                {getStatusIcon(quotation.status)}
                <span className="ml-1">{STATUS_LABELS[quotation.status]}</span>
              </Badge>
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{formatCurrency(quotation.total)}</span>
              </div>
              {isExpired && quotation.status !== 'EXPIRED' && quotation.status !== 'ACCEPTED' && quotation.status !== 'CONVERTED' && (
                <Badge variant="destructive" className="bg-red-600/20 border-red-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Expirada
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {quotation.status === 'DRAFT' && (
              <>
                <Button 
                  onClick={() => {
                    onEdit?.(quotation)
                    onClose()
                  }}
                  className="bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  onClick={() => onStatusChange?.(quotation.id, 'SENT')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </>
            )}
            
            <Button 
              onClick={() => onDuplicate?.(quotation)}
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>

            {onViewVersions && (
              <Button 
                onClick={() => onViewVersions(quotation)}
                variant="outline"
              >
                <History className="h-4 w-4 mr-2" />
                Ver Versiones
              </Button>
            )}

            <Button 
              onClick={handlePreviewPDF}
              variant="outline"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Vista Previa PDF
            </Button>

            <Button 
              onClick={handleDownloadPDF}
              variant="outline"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>

            {quotation.status !== 'DRAFT' && (
              <Button 
                onClick={handleEmailPDF}
                variant="outline"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar por Email
              </Button>
            )}

            <Button 
              onClick={handleCopyNumber}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>

            {['DRAFT', 'REJECTED', 'EXPIRED'].includes(quotation.status) && (
              <Button 
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>

          {/* Status Change Options */}
          {NEXT_STATUS_OPTIONS[quotation.status].length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Cambiar Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {NEXT_STATUS_OPTIONS[quotation.status].map(status => (
                    <Button
                      key={status}
                      onClick={() => onStatusChange?.(quotation.id, status)}
                      variant="outline"
                      size="sm"
                    >
                      {getStatusIcon(status)}
                      <span className="ml-2">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Info */}
            {clientInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {clientInfo.type === 'client' ? (
                      <>
                        <Building2 className="h-5 w-5 text-brand-purple" />
                        Cliente
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-brand-blue" />
                        Prospecto
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-medium text-lg">{clientInfo.name}</div>
                  {clientInfo.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {clientInfo.company}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {clientInfo.email}
                  </div>
                  {clientInfo.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {clientInfo.phone}
                    </div>
                  )}
                  {clientInfo.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {clientInfo.address}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Creada:</span>
                  <span className="font-medium">{formatDate(quotation.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Válida hasta:</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {formatDate(quotation.validUntil)}
                  </span>
                </div>
                {quotation.sentAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Enviada:</span>
                    <span className="font-medium">{formatDateTime(quotation.sentAt)}</span>
                  </div>
                )}
                {quotation.viewedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vista:</span>
                    <span className="font-medium">{formatDateTime(quotation.viewedAt)}</span>
                  </div>
                )}
                {quotation.respondedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Respondida:</span>
                    <span className="font-medium">{formatDateTime(quotation.respondedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Link */}
          {quotation.opportunity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-brand-purple" />
                  Oportunidad Relacionada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{quotation.opportunity.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Etapa: {quotation.opportunity.stage} • Valor: {formatCurrency(quotation.opportunity.value)}
                    </div>
                  </div>
                  <Link href={`/opportunities/${quotation.opportunity.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Oportunidad
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {quotation.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-brand-blue" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{quotation.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-brand-green" />
                Servicios / Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Descripción</th>
                      <th className="text-right py-2 px-4 font-medium">Cantidad</th>
                      <th className="text-right py-2 px-4 font-medium">Precio Unit.</th>
                      <th className="text-right py-2 px-4 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={item.id || index} className="border-b">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{item.metadata?.serviceName || item.description}</div>
                            {item.metadata?.category && (
                              <div className="text-sm text-muted-foreground">
                                {item.metadata.category.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          {item.quantity} {item.metadata?.unit || 'unit'}
                        </td>
                        <td className="text-right py-3 px-4">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discounts > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Descuentos:</span>
                    <span>-{formatCurrency(quotation.discounts)}</span>
                  </div>
                )}
                {quotation.taxes > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span>Impuestos:</span>
                    <span>+{formatCurrency(quotation.taxes)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          {quotation.terms && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-brand-purple" />
                  Términos y Condiciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.terms}</p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          {quotation.notes && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  Notas Internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Created By */}
          {quotation.createdBy && (
            <div className="text-sm text-muted-foreground text-center">
              Creado por {quotation.createdBy.firstName} {quotation.createdBy.lastName} el {formatDateTime(quotation.createdAt)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}