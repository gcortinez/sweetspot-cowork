'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  Calendar, 
  FileText,
  Eye,
  Edit,
  Copy,
  Trash2,
  Plus,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Send,
  RefreshCw,
  History,
  Star,
  Loader2
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { listQuotationsAction } from '@/lib/actions/quotations'

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
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
  notes?: string
  createdAt: string
  updatedAt: string
  items: QuotationItem[]
  client: {
    id: string
    name: string
    email: string
  }
  opportunity?: {
    id: string
    title: string
    stage: string
    value: number
  }
}

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuotationVersionsModalProps {
  baseQuotation: Quotation | null
  isOpen: boolean
  onClose: () => void
  onViewVersion: (quotation: Quotation) => void
  onEditVersion: (quotation: Quotation) => void
  onDuplicateVersion: (quotation: Quotation) => void
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

export default function QuotationVersionsModal({ 
  baseQuotation,
  isOpen, 
  onClose,
  onViewVersion,
  onEditVersion,
  onDuplicateVersion
}: QuotationVersionsModalProps) {
  const [versions, setVersions] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load all versions when modal opens
  useEffect(() => {
    if (isOpen && baseQuotation) {
      loadVersions()
    }
  }, [isOpen, baseQuotation])

  const loadVersions = async () => {
    if (!baseQuotation) return
    
    setIsLoading(true)
    try {
      // Get base number without version suffix
      const baseNumber = baseQuotation.number.split('-v')[0]
      
      const result = await listQuotationsAction({
        search: baseNumber,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      if (result.success) {
        // Filter to only include versions of this quotation
        const quotationVersions = (result.data || []).filter((q: Quotation) => 
          q.number.startsWith(baseNumber)
        )
        setVersions(quotationVersions)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar las versiones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      toast({
        title: "Error",
        description: "Error al cargar las versiones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getVersionNumber = (quotationNumber: string) => {
    const versionMatch = quotationNumber.match(/-v(\d+)$/)
    return versionMatch ? parseInt(versionMatch[1]) : 1
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || FileText
    return <IconComponent className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const isLatestVersion = (quotation: Quotation) => {
    const versionNum = getVersionNumber(quotation.number)
    const maxVersion = Math.max(...versions.map(v => getVersionNumber(v.number)))
    return versionNum === maxVersion
  }

  const handleCreateNewVersion = () => {
    if (baseQuotation) {
      onDuplicateVersion(baseQuotation)
    }
  }

  if (!baseQuotation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <History className="h-4 w-4 text-white" />
            </div>
            Versiones de Cotización
          </DialogTitle>
          <DialogDescription>
            Historial de versiones para: {baseQuotation.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {versions.length} versión{versions.length !== 1 ? 'es' : ''} encontrada{versions.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={handleCreateNewVersion}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Versión
            </Button>
          </div>

          {/* Versions List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Cargando versiones...</span>
                </div>
              </CardContent>
            </Card>
          ) : versions.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No hay versiones
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No se encontraron versiones para esta cotización
                  </p>
                  <Button onClick={handleCreateNewVersion} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Primera Versión
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <Card key={version.id} className={`${isLatestVersion(version) ? 'border-green-200 bg-green-50/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Version Info */}
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              v{getVersionNumber(version.number)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{version.number}</span>
                              {isLatestVersion(version) && (
                                <Badge variant="default" className="bg-green-600 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Actual
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(version.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge className={`${getStatusColor(version.status)} flex items-center gap-1`}>
                          {getStatusIcon(version.status)}
                          {STATUS_LABELS[version.status]}
                        </Badge>

                        {/* Total */}
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{formatCurrency(version.total)}</span>
                        </div>

                        {/* Items Count */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{version.items.length} item{version.items.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewVersion(version)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        
                        {version.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditVersion(version)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDuplicateVersion(version)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicar
                        </Button>
                      </div>
                    </div>

                    {/* Version Details */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subtotal:</span>
                          <div className="font-medium">{formatCurrency(version.subtotal)}</div>
                        </div>
                        {version.discounts > 0 && (
                          <div>
                            <span className="text-muted-foreground">Descuentos:</span>
                            <div className="font-medium text-green-600">-{formatCurrency(version.discounts)}</div>
                          </div>
                        )}
                        {version.taxes > 0 && (
                          <div>
                            <span className="text-muted-foreground">Impuestos:</span>
                            <div className="font-medium text-orange-600">+{formatCurrency(version.taxes)}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Válida hasta:</span>
                          <div className="font-medium">
                            {new Date(version.validUntil).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}