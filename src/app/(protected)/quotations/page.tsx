'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users,
  Calendar,
  Eye,
  Download,
  Mail
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { listQuotationsAction, changeQuotationStatusAction, duplicateQuotationAction, deleteQuotationAction } from '@/lib/actions/quotations'
import { AppHeader } from '@/components/shared/app-header'
import QuotationsList from '@/components/quotations/QuotationsList'
import CreateQuotationModal from '@/components/quotations/CreateQuotationModal'
import QuotationDetailModal from '@/components/quotations/QuotationDetailModal'
import EditQuotationModal from '@/components/quotations/EditQuotationModal'
import QuotationVersionsModal from '@/components/quotations/QuotationVersionsModal'

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
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

interface QuotationStats {
  total: number
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalValue: number
  averageValue: number
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'SENT', label: 'Enviadas' },
  { value: 'VIEWED', label: 'Vistas' },
  { value: 'ACCEPTED', label: 'Aceptadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'EXPIRED', label: 'Expiradas' },
  { value: 'CONVERTED', label: 'Convertidas' },
]

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Más recientes primero' },
  { value: 'createdAt-asc', label: 'Más antiguas primero' },
  { value: 'number-desc', label: 'Número descendente' },
  { value: 'number-asc', label: 'Número ascendente' },
  { value: 'total-desc', label: 'Valor mayor a menor' },
  { value: 'total-asc', label: 'Valor menor a mayor' },
]

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [stats, setStats] = useState<QuotationStats>({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    totalValue: 0,
    averageValue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [versionsQuotation, setVersionsQuotation] = useState<Quotation | null>(null)
  
  const { toast } = useToast()

  // Load quotations
  const loadQuotations = async () => {
    setIsLoading(true)
    try {
      const [sortField, sortOrder] = sortBy.split('-')
      const result = await listQuotationsAction({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 20,
        sortBy: sortField as any,
        sortOrder: sortOrder as 'asc' | 'desc',
      })
      
      if (result.success && result.data) {
        const quotations = result.data.quotations || []
        const pagination = result.data.pagination || { totalPages: 1 }
        
        setQuotations(quotations)
        
        // Calculate stats
        const stats = {
          total: quotations.length,
          draft: quotations.filter(q => q.status === 'DRAFT').length,
          sent: quotations.filter(q => q.status === 'SENT').length,
          accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
          rejected: quotations.filter(q => q.status === 'REJECTED').length,
          expired: quotations.filter(q => q.status === 'EXPIRED').length,
          converted: quotations.filter(q => q.status === 'CONVERTED').length,
          totalValue: quotations.reduce((sum, q) => sum + q.total, 0),
          averageValue: quotations.length > 0 ? quotations.reduce((sum, q) => sum + q.total, 0) / quotations.length : 0,
        }
        setStats(stats)
        
        // Set pagination from server response
        setTotalPages(pagination.totalPages)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar las cotizaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading quotations:', error)
      toast({
        title: "Error",
        description: "Error al cargar las cotizaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load quotations on mount and when filters change
  useEffect(() => {
    loadQuotations()
  }, [searchTerm, statusFilter, sortBy, currentPage])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        loadQuotations()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Action handlers
  const handleQuotationCreated = () => {
    setShowCreateModal(false)
    loadQuotations()
  }

  const handleQuotationUpdated = () => {
    setEditingQuotation(null)
    loadQuotations()
  }

  const handleQuotationView = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
  }

  const handleQuotationEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation)
  }

  const handleQuotationDelete = async (quotationId: string) => {
    try {
      const result = await deleteQuotationAction({ id: quotationId })
      
      if (result.success) {
        toast({
          title: "Cotización eliminada",
          description: "La cotización ha sido eliminada exitosamente",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar la cotización",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting quotation:', error)
      toast({
        title: "Error",
        description: "Error al eliminar la cotización",
        variant: "destructive",
      })
    }
  }

  const handleQuotationDuplicate = async (quotation: Quotation) => {
    try {
      const result = await duplicateQuotationAction({ id: quotation.id })
      
      if (result.success) {
        toast({
          title: "Cotización duplicada",
          description: "Se ha creado una nueva versión de la cotización",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al duplicar la cotización",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error duplicating quotation:', error)
      toast({
        title: "Error",
        description: "Error al duplicar la cotización",
        variant: "destructive",
      })
    }
  }

  const handleQuotationStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      const result = await changeQuotationStatusAction({
        id: quotationId,
        status: newStatus,
      })
      
      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: "El estado de la cotización ha sido actualizado",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error changing quotation status:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleViewVersions = (quotation: Quotation) => {
    setVersionsQuotation(quotation)
    setSelectedQuotation(null)
  }

  const handleVersionAction = (action: string, quotation: Quotation) => {
    switch (action) {
      case 'view':
        setSelectedQuotation(quotation)
        setVersionsQuotation(null)
        break
      case 'edit':
        setEditingQuotation(quotation)
        setVersionsQuotation(null)
        break
      case 'duplicate':
        handleQuotationDuplicate(quotation)
        setVersionsQuotation(null)
        break
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <AppHeader 
        currentPage="Cotizaciones"
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'Cotizaciones' }
        ]}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Title Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-purple-700 bg-clip-text text-transparent">
              Gestión de Cotizaciones
            </h1>
            <p className="text-gray-600 mt-1">Administra y da seguimiento a todas las cotizaciones</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-brand-purple to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cotización
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cotizaciones</CardTitle>
              <div className="p-2 bg-gradient-to-r from-brand-purple to-purple-700 rounded-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500">
                {stats.draft} borradores, {stats.sent} enviadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-gray-500">
                Promedio: {formatCurrency(stats.averageValue)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aceptadas</CardTitle>
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.accepted}</div>
              <p className="text-xs text-gray-500">
                {stats.converted} convertidas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
              <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.sent}</div>
              <p className="text-xs text-gray-500">
                {stats.expired} expiradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por número, título o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-brand-purple focus:ring-brand-purple"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-brand-purple focus:ring-brand-purple">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map(filter => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ordenar por</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-gray-200 focus:border-brand-purple focus:ring-brand-purple">
                    <SelectValue placeholder="Selecciona orden" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Quotations List */}
      <QuotationsList
        quotations={quotations}
        onEdit={handleQuotationEdit}
        onDelete={handleQuotationDelete}
        onView={handleQuotationView}
        onDuplicate={handleQuotationDuplicate}
        onChangeStatus={handleQuotationStatusChange}
        onCreateNew={() => setShowCreateModal(true)}
        onDownloadPDF={(quotationId) => {
          const quotation = quotations.find(q => q.id === quotationId)
          if (quotation) setSelectedQuotation(quotation)
        }}
        isLoading={isLoading}
      />

      {/* Create Quotation Modal */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onQuotationCreated={handleQuotationCreated}
      />

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        quotation={selectedQuotation}
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onEdit={handleQuotationEdit}
        onDelete={handleQuotationDelete}
        onDuplicate={handleQuotationDuplicate}
        onStatusChange={handleQuotationStatusChange}
        onViewVersions={handleViewVersions}
      />

      {/* Edit Quotation Modal */}
      <EditQuotationModal
        quotation={editingQuotation}
        isOpen={!!editingQuotation}
        onClose={() => setEditingQuotation(null)}
        onQuotationUpdated={handleQuotationUpdated}
      />

      {/* Quotation Versions Modal */}
      <QuotationVersionsModal
        baseQuotation={versionsQuotation}
        isOpen={!!versionsQuotation}
        onClose={() => setVersionsQuotation(null)}
        onViewVersion={(quotation) => handleVersionAction('view', quotation)}
        onEditVersion={(quotation) => handleVersionAction('edit', quotation)}
        onDuplicateVersion={(quotation) => handleVersionAction('duplicate', quotation)}
      />
      </div>
    </div>
  )
}