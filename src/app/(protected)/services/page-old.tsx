'use client'

import React, { useState, useEffect } from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  listServicesAction, 
  createCoworkingServicesAction,
  getServicesByCategoryAction,
  getServicePackagesAction 
} from '@/lib/actions/service'
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
  Shield,
  Wrench,
  Users,
  Calendar as CalendarIcon,
  Briefcase,
  Sparkles,
  Download,
  Upload
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  category: string
  serviceType: string
  price: number
  unit: string
  availability: string
  isActive: boolean
  pricingTiers: any[]
  metadata: any
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ServiceStats {
  totalServices: number
  activeServices: number
  categoriesCount: number
  averagePrice: number
  topCategory: string
  recentlyAdded: number
}

const CATEGORY_ICONS = {
  'PRINTING': Printer,
  'COFFEE': Coffee,
  'FOOD': Coffee,
  'PARKING': Car,
  'STORAGE': Package,
  'MAIL': Mail,
  'PHONE': Phone,
  'INTERNET': Phone,
  'CLEANING': Shield,
  'BUSINESS_SUPPORT': Briefcase,
  'EVENT_SERVICES': CalendarIcon,
  'WELLNESS': Activity,
  'TRANSPORTATION': Car,
  'CONSULTING': Users,
  'MAINTENANCE': Wrench,
}

const CATEGORY_COLORS = {
  'PRINTING': 'bg-blue-100 text-blue-800',
  'COFFEE': 'bg-amber-100 text-amber-800',
  'FOOD': 'bg-orange-100 text-orange-800',
  'PARKING': 'bg-gray-100 text-gray-800',
  'STORAGE': 'bg-purple-100 text-purple-800',
  'MAIL': 'bg-green-100 text-green-800',
  'PHONE': 'bg-indigo-100 text-indigo-800',
  'INTERNET': 'bg-blue-100 text-blue-800',
  'CLEANING': 'bg-teal-100 text-teal-800',
  'BUSINESS_SUPPORT': 'bg-emerald-100 text-emerald-800',
  'EVENT_SERVICES': 'bg-rose-100 text-rose-800',
  'WELLNESS': 'bg-pink-100 text-pink-800',
  'TRANSPORTATION': 'bg-slate-100 text-slate-800',
  'CONSULTING': 'bg-cyan-100 text-cyan-800',
  'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
}

const BREADCRUMB_ITEMS = [
  { label: 'Servicios', href: '/services' },
]

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
      const result = await listServicesAction({
        page: 1,
        limit: 100,
        search: searchTerm,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        isActive: activeTab === 'active' ? true : activeTab === 'inactive' ? false : undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      })

      if (result.success) {
        setServices(result.data?.services || [])
        
        // Calculate stats
        const totalServices = result.data?.services?.length || 0
        const activeServices = result.data?.services?.filter((s: Service) => s.isActive).length || 0
        const categories = [...new Set(result.data?.services?.map((s: Service) => s.category) || [])]
        const averagePrice = totalServices > 0 
          ? result.data?.services?.reduce((sum: number, s: Service) => sum + s.price, 0) / totalServices 
          : 0
        
        const categoryCount = result.data?.services?.reduce((acc: any, s: Service) => {
          acc[s.category] = (acc[s.category] || 0) + 1
          return acc
        }, {})
        
        const topCategory = Object.entries(categoryCount).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || ''
        
        // Services added in the last 7 days
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentlyAdded = result.data?.services?.filter((s: Service) => 
          new Date(s.createdAt) > weekAgo
        ).length || 0

        setStats({
          totalServices,
          activeServices,
          categoriesCount: categories.length,
          averagePrice,
          topCategory,
          recentlyAdded
        })
      } else {
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
      const result = await createCoworkingServicesAction()
      
      if (result.success) {
        toast({
          title: "Servicios creados",
          description: result.message || "Servicios predefinidos creados exitosamente",
          duration: 3000,
        })
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear los servicios",
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

  const handleEditService = (service: Service) => {
    setEditingService(service)
  }

  const handleDeleteService = async (serviceId: string) => {
    // This would be implemented with a delete action
    console.log('Delete service:', serviceId)
    // For now, just reload the services
    loadServices()
  }

  const filteredServices = services.filter(service => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && service.isActive) ||
      (activeTab === 'inactive' && !service.isActive)
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTab && matchesCategory && matchesSearch
  })

  const categories = [...new Set(services.map(service => service.category))]

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
                    <span className="text-2xl font-bold text-emerald-900">{stats.averagePrice ? `$${stats.averagePrice.toFixed(0)}` : 'N/A'}</span>
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
                  <p className="text-2xl font-bold text-green-600">{stats.activeServices}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categorías</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.categoriesCount}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Precio Promedio</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${stats.averagePrice.toLocaleString()}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categoría Principal</p>
                  <p className="text-lg font-bold text-pink-600">
                    {stats.topCategory.replace('_', ' ')}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Añadidos (7d)</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.recentlyAdded}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando servicios...</span>
            </div>
          ) : (
            <ServicesTable 
              services={filteredServices}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              categoryIcons={CATEGORY_ICONS}
              categoryColors={CATEGORY_COLORS}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateServiceModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onServiceCreated={handleServiceCreated}
      />

      {editingService && (
        <EditServiceModal 
          service={editingService}
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          onServiceUpdated={handleServiceUpdated}
        />
      )}
    </div>
  )
}