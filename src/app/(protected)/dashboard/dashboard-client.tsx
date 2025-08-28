'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Building2, 
  Users, 
  Target,
  DollarSign,
  Settings,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
// Lazy load heavy components

const QuickViewModal = dynamic(
  () => import('@/components/dashboard/QuickViewModal'),
  { 
    loading: () => <div className="animate-pulse">Cargando...</div>,
    ssr: false 
  }
)

// Lazy load tab content components
const CRMTab = lazy(() => import('./tabs/CRMTab'))
const OperacionTab = lazy(() => import('./tabs/OperacionTab'))
const AnaliticaTab = lazy(() => import('./tabs/AnaliticaTab'))
const FacturacionTab = lazy(() => import('./tabs/FacturacionTab'))

interface DashboardClientProps {
  user: any
  initialStats: any
  initialActivities: any[]
  error?: string | null
}

export default function DashboardClient({ 
  user, 
  initialStats, 
  initialActivities, 
  error 
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('crm')
  const [quickViewData, setQuickViewData] = useState<any>(null)
  const [quickViewType, setQuickViewType] = useState<'prospect' | 'client' | 'opportunity' | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  const { toast } = useToast()

  // Memoized handlers
  const openQuickView = useCallback((data: any, type: 'prospect' | 'client' | 'opportunity') => {
    setQuickViewData(data)
    setQuickViewType(type)
    setShowQuickView(true)
  }, [])

  const closeQuickView = useCallback(() => {
    setShowQuickView(false)
    setQuickViewData(null)
    setQuickViewType(null)
  }, [])


  // Show error state if data loading failed
  if (error && !initialStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error al cargar el dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Show empty state if no data
  if (!initialStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">No hay datos disponibles</p>
            <p className="text-sm">Comienza creando tu primera oportunidad, cliente o prospecto</p>
          </div>
          <div className="space-x-2">
            <Link href="/opportunities">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Crear Oportunidad
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Crear Cliente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Dashboard Header */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-4 md:p-8 text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 truncate">
                    Dashboard SweetSpot
                  </h2>
                  <p className="text-purple-100 text-sm md:text-lg leading-tight">
                    Gestiona tu coworking de manera integral
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 md:mt-3 space-y-1 sm:space-y-0">
                    <div className="flex items-center text-purple-100">
                      <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="text-xs md:text-sm">Actualizado hace 5 min</span>
                    </div>
                    <div className="flex items-center text-purple-100">
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="text-xs md:text-sm">Sistema activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs with Lazy Loading */}
        <Tabs defaultValue="crm" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white shadow-md rounded-xl p-1 gap-1">
            <TabsTrigger value="crm" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">CRM</span>
              <span className="sm:hidden">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="operacion" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Operación</span>
              <span className="sm:hidden">Ops</span>
            </TabsTrigger>
            <TabsTrigger value="analitica" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analítica</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="facturacion" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Facturación</span>
              <span className="sm:hidden">$</span>
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabSkeleton />}>
            <TabsContent value="crm" className="mt-6">
              <CRMTab dashboardData={initialStats} openQuickView={openQuickView} />
            </TabsContent>

            <TabsContent value="operacion" className="mt-6">
              <OperacionTab dashboardData={initialStats} />
            </TabsContent>

            <TabsContent value="analitica" className="mt-6">
              <AnaliticaTab dashboardData={initialStats} />
            </TabsContent>

            <TabsContent value="facturacion" className="mt-6">
              <FacturacionTab dashboardData={initialStats} />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>

      {/* Lazy loaded modals */}
      {showQuickView && quickViewType && (
        <QuickViewModal 
          isOpen={showQuickView}
          onClose={closeQuickView}
          data={quickViewData}
          type={quickViewType}
        />
      )}
    </>
  )
}

// Loading skeleton for tabs
function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}