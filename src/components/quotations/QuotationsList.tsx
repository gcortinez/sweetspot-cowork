'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Send,
  Download,
  RefreshCw,
  FileText,
  Plus,
  Search,
  Filter,
  Loader2
} from 'lucide-react'

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
  client: {
    id: string
    name: string
    email: string
    company?: string
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
    company?: string
  }
  items: QuotationItem[]
}

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuotationsListProps {
  quotations: Quotation[]
  onEdit: (quotation: Quotation) => void
  onDelete: (quotationId: string) => void
  onView: (quotation: Quotation) => void
  onDuplicate: (quotation: Quotation) => void
  onChangeStatus: (quotationId: string, status: string) => void
  onCreateNew: () => void
  onDownloadPDF?: (quotationId: string) => void
  onSendEmail?: (quotation: Quotation) => void
  isLoading?: boolean
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

export default function QuotationsList({ 
  quotations, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate, 
  onChangeStatus, 
  onCreateNew,
  onDownloadPDF,
  onSendEmail,
  isLoading = false
}: QuotationsListProps) {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const handleDelete = (quotationId: string, quotationNumber: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cotización ${quotationNumber}?`)) {
      onDelete(quotationId)
    }
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || FileText
    return <IconComponent className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const getClientName = (quotation: Quotation) => {
    if (quotation.client) {
      return quotation.client.name
    } else if (quotation.lead) {
      return `${quotation.lead.firstName} ${quotation.lead.lastName}`
    }
    return 'Cliente no especificado'
  }

  const getClientInfo = (quotation: Quotation) => {
    if (quotation.client) {
      return quotation.client.company || quotation.client.email
    } else if (quotation.lead) {
      return quotation.lead.company || quotation.lead.email
    }
    return ''
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Cargando cotizaciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No hay cotizaciones
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primera cotización para comenzar
            </p>
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cotización
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cotizaciones</span>
          <Button onClick={onCreateNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Válida hasta</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {quotation.number}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{getClientName(quotation)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getClientInfo(quotation)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{quotation.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        ${quotation.total.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {quotation.currency}
                      </span>
                    </div>
                    {quotation.discounts > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Desc: ${quotation.discounts.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`${getStatusColor(quotation.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(quotation.status)}
                      {STATUS_LABELS[quotation.status]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={isExpired(quotation.validUntil) ? 'text-red-600' : ''}>
                        {formatDate(quotation.validUntil)}
                      </span>
                    </div>
                    {isExpired(quotation.validUntil) && quotation.status !== 'EXPIRED' && (
                      <div className="text-xs text-red-600">Expirada</div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(quotation.createdAt)}
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
                        <DropdownMenuItem onClick={() => onView(quotation)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(quotation.number)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar número
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {quotation.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => onEdit(quotation)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => onDuplicate(quotation)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        
                        {/* Status change options */}
                        {NEXT_STATUS_OPTIONS[quotation.status].length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                            {NEXT_STATUS_OPTIONS[quotation.status].map(status => (
                              <DropdownMenuItem 
                                key={status}
                                onClick={async () => {
                                  setChangingStatus(quotation.id)
                                  await onChangeStatus(quotation.id, status)
                                  setChangingStatus(null)
                                }}
                                disabled={changingStatus === quotation.id}
                              >
                                {changingStatus === quotation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  getStatusIcon(status)
                                )}
                                <span className="ml-2">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {quotation.status === 'DRAFT' && onSendEmail && (
                          <DropdownMenuItem onClick={() => onSendEmail(quotation)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar por Email
                          </DropdownMenuItem>
                        )}
                        
                        {onDownloadPDF && (
                          <DropdownMenuItem onClick={() => onDownloadPDF(quotation.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                        )}
                        
                        {['DRAFT', 'REJECTED', 'EXPIRED'].includes(quotation.status) && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(quotation.id, quotation.number)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}