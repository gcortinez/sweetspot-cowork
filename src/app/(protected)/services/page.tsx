'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/shared/app-header'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
// Removed direct server action imports to avoid client/server component conflicts
// Using API routes instead
import { useToast } from '@/hooks/use-toast'
import ServicesTable from '@/components/services/ServicesTable'
import CreateServiceModal from '@/components/services/CreateServiceModal'
import EditServiceModal from '@/components/services/EditServiceModal'
import ServiceDetailModal from '@/components/services/ServiceDetailModal'
import {
  Settings,
  Plus,
  DollarSign,
  Package,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRight,
  Trophy,
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  Square,
  CheckSquare,
  X,
  Bell,
  AlertTriangle,
  Building2,
  Loader2,
  Activity,
  Coffee,
  Printer,
  Car,
  Mail,
  Phone,
  Users,
  Wrench,
  Download,
  Eye,
  Globe,
  Zap,
  Layers,
  TrendingUp
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  category: string
  price: number
  currency: string
  isActive: boolean
  pricing?: any
  availability?: any
  requirements?: any
  images?: string[]
  tags?: string[]
  duration?: any
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface ServiceStats {
  totalServices: number
  activeServices: number
  categoriesCount: number
  averagePrice: number
  mostPopularCategory: string
  maxPrice: number
}

const categories = [
  'PRINTING', 'COFFEE', 'FOOD', 'PARKING', 'STORAGE', 'MAIL', 'PHONE', 'INTERNET',
  'CLEANING', 'BUSINESS_SUPPORT', 'EVENT_SERVICES', 'WELLNESS', 'TRANSPORTATION',
  'CONSULTING', 'MAINTENANCE'
]

const CATEGORY_ICONS = {
  'PRINTING': Printer,
  'COFFEE': Coffee,
  'FOOD': Coffee,
  'PARKING': Car,
  'STORAGE': Package,
  'MAIL': Mail,
  'PHONE': Phone,
  'INTERNET': Globe,
  'CLEANING': Settings,
  'BUSINESS_SUPPORT': Building2,
  'EVENT_SERVICES': Calendar,
  'WELLNESS': Activity,
  'TRANSPORTATION': Car,
  'CONSULTING': Users,
  'MAINTENANCE': Wrench,
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [detailService, setDetailService] = useState<Service | null>(null)
  const [isCreatingPredefined, setIsCreatingPredefined] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadServices = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true)
      } else {
        setIsFiltering(true)
      }
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy: 'name',
        sortOrder: 'asc'
      })
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (activeTab === 'active') params.append('isActive', 'true')
      if (activeTab === 'inactive') params.append('isActive', 'false')
      
      const response = await fetch(`/api/services?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const services = result.data?.services || []
        setServices(services)
        // Calculate stats
        const totalServices = services.length || 0
        const activeServices = services.filter((s: any) => s.isActive).length || 0
        const categoriesCount = new Set(services.map((s: any) => s.category)).size
        const averagePrice = services.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0) / totalServices || 0
        
        setStats({
          totalServices,
          activeServices,
          categoriesCount,
          averagePrice,
          mostPopularCategory: 'COFFEE',
          maxPrice: Math.max(...(services.map((s: any) => Number(s.price) || 0) || [0]))
        })
      } else {
        console.error('Error loading services:', result.error)
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
      setIsFiltering(false)
    }
  }, [debouncedSearchTerm, selectedCategory, activeTab, toast])

  const handleDeleteAllServices = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteAll' })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Servicios eliminados",
          description: "Se han eliminado todos los servicios exitosamente",
          duration: 3000,
        })
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar los servicios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting all services:', error)
      toast({
        title: "Error",
        description: "Error al eliminar los servicios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePredefinedServices = async () => {
    try {
      setIsCreatingPredefined(true)
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'createPredefined' })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Servicios creados",
          description: "Se han creado los servicios predefinidos exitosamente",
          duration: 3000,
        })
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear los servicios predefinidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating predefined services:', error)
      toast({
        title: "Error",
        description: "Error al crear los servicios predefinidos",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPredefined(false)
    }
  }

  const handleServiceCreated = () => {
    setShowCreateModal(false)
    loadServices()
  }

  const handleServiceUpdated = () => {
    setEditingService(null)
    loadServices()
  }

  const handleServiceDeleted = async (serviceId: string) => {
    console.log('ServicesPage: handleServiceDeleted called with:', serviceId)
    try {
      setDeletingServiceId(serviceId)
      console.log('ServicesPage: Set deletingServiceId to:', serviceId)
      
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      console.log('ServicesPage: Delete response:', result)
      
      if (response.ok && result.success) {
        toast({
          title: "Servicio eliminado",
          description: "El servicio ha sido eliminado exitosamente",
          duration: 4000,
        })
        await loadServices()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar el servicio",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el servicio",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      console.log('ServicesPage: Setting deletingServiceId to null')
      setDeletingServiceId(null)
    }
  }

  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
  }

  const handleServiceDetail = (service: Service) => {
    setDetailService(service)
  }

  const handleServiceDetailEdit = (service: Service) => {
    setDetailService(null) // Close detail modal
    setEditingService(service) // Open edit modal
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load services initially
  useEffect(() => {
    loadServices(true)
  }, [])

  // Load services when filters change
  useEffect(() => {
    if (debouncedSearchTerm !== '' || selectedCategory !== 'all' || activeTab !== 'all') {
      loadServices(false)
    }
  }, [debouncedSearchTerm, selectedCategory, activeTab, loadServices])

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
              <p className="text-gray-600 mt-2">Gestiona el catálogo de servicios de tu coworking</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowDeleteAllConfirm(true)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Todos
              </Button>
              <Button 
                onClick={handleCreatePredefinedServices}
                variant="outline"
                disabled={isCreatingPredefined}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isCreatingPredefined ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Servicios Predefinidos
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-purple hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-brand-purple" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Servicios</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalServices}
                    </p>
                    <p className="text-xs text-brand-purple flex items-center mt-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Catálogo completo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-soft hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Servicios Activos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.activeServices}
                    </p>
                    <p className="text-xs text-success flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      Disponibles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-soft hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-warning" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Categorías</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.categoriesCount}
                    </p>
                    <p className="text-xs text-warning flex items-center mt-1">
                      <Layers className="h-3 w-3 mr-1" />
                      Tipos de servicio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-soft hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-brand-blue" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Precio Promedio</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${stats.averagePrice.toFixed(0)}
                    </p>
                    <p className="text-xs text-brand-blue flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Por servicio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Filters and Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
                <TabsTrigger value="inactive">Inactivos</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              onClick={handleCreatePredefinedServices}
              disabled={isCreatingPredefined}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {isCreatingPredefined ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Servicios Predefinidos
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <ServicesTable
              services={services}
              isLoading={isLoading}
              isFiltering={isFiltering}
              onEdit={handleServiceEdit}
              onDelete={handleServiceDeleted}
              onDetail={handleServiceDetail}
              onCreateService={() => setShowCreateModal(true)}
              onCreatePredefined={handleCreatePredefinedServices}
              isCreatingPredefined={isCreatingPredefined}
              deletingServiceId={deletingServiceId}
            />
          </div>
        </div>
      </main>

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onServiceCreated={handleServiceCreated}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        service={editingService}
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onServiceUpdated={handleServiceUpdated}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={detailService}
        isOpen={!!detailService}
        onClose={() => setDetailService(null)}
        onEdit={handleServiceDetailEdit}
      />

      {/* Delete All Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={() => {
          setShowDeleteAllConfirm(false)
          handleDeleteAllServices()
        }}
        title="Eliminar Todos los Servicios"
        description="¿Estás seguro de que quieres eliminar TODOS los servicios? Esta acción no se puede deshacer y eliminará permanentemente todos los servicios del catálogo."
        confirmText="Eliminar Todos"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}