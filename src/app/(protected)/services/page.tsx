'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Removed direct server action imports to avoid client/server component conflicts
// Using API routes instead
import { useToast } from '@/hooks/use-toast'
import ServicesTable from '@/components/services/ServicesTable'
import CreateServiceModal from '@/components/services/CreateServiceModal'
import EditServiceModal from '@/components/services/EditServiceModal'
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
  Zap
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  category: string
  basePrice: number
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
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isCreatingPredefined, setIsCreatingPredefined] = useState(false)
  const { toast } = useToast()

  const loadServices = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy: 'name',
        sortOrder: 'asc'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (activeTab === 'active') params.append('isActive', 'true')
      if (activeTab === 'inactive') params.append('isActive', 'false')
      
      const response = await fetch(`/api/services?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setServices(result.data || [])
        // Calculate stats
        const totalServices = result.data?.length || 0
        const activeServices = result.data?.filter((s: any) => s.isActive).length || 0
        const categoriesCount = new Set(result.data?.map((s: any) => s.category)).size
        const averagePrice = result.data?.reduce((sum: number, s: any) => sum + s.basePrice, 0) / totalServices || 0
        
        setStats({
          totalServices,
          activeServices,
          categoriesCount,
          averagePrice,
          mostPopularCategory: 'COFFEE',
          maxPrice: Math.max(...(result.data?.map((s: any) => s.basePrice) || [0]))
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

  const handleServiceDeleted = () => {
    loadServices()
  }

  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
  }

  useEffect(() => {
    loadServices()
  }, [searchTerm, selectedCategory, activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-purple-50/50 to-indigo-50/50 shadow-lg border-b border-purple-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
                <p className="text-gray-600">Administra los servicios disponibles en tu cowork</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-100 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Estadísticas de Servicios</CardTitle>
                      <p className="text-green-100 mt-1">Resumen de la gestión de servicios</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-900">{stats.totalServices}</span>
                      <p className="text-sm text-blue-600 font-medium mt-1">Total Servicios</p>
                    </div>
                    
                    <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-900">{stats.activeServices}</span>
                      <p className="text-sm text-green-600 font-medium mt-1">Activos</p>
                    </div>
                    
                    <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-purple-900">{stats.categoriesCount}</span>
                      <p className="text-sm text-purple-600 font-medium mt-1">Categorías</p>
                    </div>
                    
                    <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-emerald-900">${stats.averagePrice.toFixed(0)}</span>
                      <p className="text-sm text-emerald-600 font-medium mt-1">Precio Promedio</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
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
            <Button 
              variant="outline" 
              onClick={handleCreatePredefinedServices}
              disabled={isCreatingPredefined}
              className="gap-2"
            >
              {isCreatingPredefined ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Servicios Predefinidos
            </Button>
          </div>
        </div>

        {/* Services Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Lista de Servicios</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="active">Activos</TabsTrigger>
                  <TabsTrigger value="inactive">Inactivos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ServicesTable
              services={services}
              isLoading={isLoading}
              onEdit={handleServiceEdit}
              onDelete={handleServiceDeleted}
            />
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}