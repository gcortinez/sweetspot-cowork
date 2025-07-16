'use client'

import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Crown, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  Activity,
  PlusCircle,
  Settings,
  Bell,
  UserCheck,
  Target,
  Star,
  ArrowRight,
  Mail,
  Phone,
  User,
  Zap,
  FileText,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { CoworkSelector } from "@/components/admin/cowork-selector";
import { PlatformStats } from "@/components/admin/platform-stats";
import { CoworkManagement } from "@/components/admin/cowork-management";
import { UserManagement } from "@/components/admin/user-management";
import { useCoworkSelection } from "@/contexts/cowork-selection-context";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { getDashboardStats, getRecentActivities } from '@/lib/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import QuickViewModal from '@/components/dashboard/QuickViewModal';

// Client-side dashboard page
export default function DashboardPage() {
  // Get user on client side
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }
  
  if (!user) {
    redirect('/auth/login');
    return null;
  }

  // Get user role from metadata (check private first, then public)
  const privateMetadata = user.privateMetadata as any;
  const publicMetadata = user.publicMetadata as any;
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  console.log('🚀 CLIENT-SIDE DASHBOARD:', {
    email: user.emailAddresses[0]?.emailAddress,
    role: userRole,
    isSuperAdmin,
    privateMetadata,
    publicMetadata
  });

  return (
    <DashboardContent user={user} isSuperAdmin={isSuperAdmin} />
  );
}

// Dashboard content component
function DashboardContent({ 
  user, 
  isSuperAdmin 
}: { 
  user: any;
  isSuperAdmin: boolean;
}) {
  const {
    selectedCowork,
    isPlatformView,
    isLoadingCoworks
  } = useCoworkSelection();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const { toast } = useToast();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (isSuperAdmin) {
        // For super admin, we'll handle differently later
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [statsResult, activitiesResult] = await Promise.all([
          getDashboardStats(),
          getRecentActivities()
        ]);

        if (statsResult.success) {
          console.log('🔍 Dashboard data loaded:', statsResult.data);
          console.log('📊 Recent opportunities:', statsResult.data?.opportunities?.recent);
          setDashboardData(statsResult.data);
        } else {
          setError(statsResult.error || 'Error al cargar datos del dashboard');
          toast({
            title: "Error",
            description: statsResult.error || 'Error al cargar datos del dashboard',
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Error de conexión');
        toast({
          title: "Error de conexión",
          description: 'No se pudo conectar con el servidor',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isSuperAdmin, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
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
    );
  }

  // Show message when no data is available
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Enhanced Header with Purple Gradient Theme */}
      <header className="bg-gradient-to-r from-white via-purple-50/50 to-indigo-50/50 shadow-lg border-b border-purple-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 ${
                  isSuperAdmin 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-purple' 
                    : 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-brand'
                }`}>
                  {isSuperAdmin ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <Building2 className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">SweetSpot</h1>
                  {/* Cowork name display */}
                  <div className="text-sm">
                    {isSuperAdmin ? (
                      isPlatformView ? (
                        <span className="text-purple-600 font-medium">Vista General de la Plataforma</span>
                      ) : (
                        selectedCowork ? (
                          <span className="text-indigo-600 font-medium">{selectedCowork.name}</span>
                        ) : (
                          <span className="text-gray-500">Seleccionar Cowork</span>
                        )
                      )
                    ) : (
                      <span className="text-purple-600 font-medium">Plataforma CRM</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Enhanced Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Cowork Selector for Super Admins */}
              {isSuperAdmin && <CoworkSelector />}
              
              {/* Enhanced User Role Display */}
              {isSuperAdmin ? (
                <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 shadow-purple text-xs font-medium px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-300 shadow-soft text-xs font-medium px-3 py-1">
                  <User className="h-3 w-3 mr-1" />
                  {user.privateMetadata?.role || user.publicMetadata?.role || 'User'}
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" className="relative text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
              </Button>
              
              <div className="text-sm text-gray-700 font-medium">
                Bienvenido, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
              </div>
              
              <SignOutButton>
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors">
                  Cerrar Sesión
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* CRM Navigation Menu */}
      {!isSuperAdmin && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                  <Building2 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <span className="text-gray-300">/</span>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Prospectos
                  </Button>
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/opportunities">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <Target className="h-4 w-4 mr-2" />
                    Oportunidades
                  </Button>
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/clients">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <Building2 className="h-4 w-4 mr-2" />
                    Clientes
                  </Button>
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple"
                  onClick={() => setShowCreateLeadModal(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Prospecto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isSuperAdmin ? (
        <SuperAdminDashboard />
      ) : (
        <CoworkDashboard 
          dashboardData={dashboardData} 
          showCreateLeadModal={showCreateLeadModal}
          setShowCreateLeadModal={setShowCreateLeadModal}
        />
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal 
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        onLeadCreated={() => {
          toast({
            title: "¡Prospecto creado!",
            description: "El nuevo prospecto ha sido creado exitosamente.",
          });
        }}
      />
    </div>
  );
}

// Super Admin Dashboard with platform view
function SuperAdminDashboard() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Platform Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-brand-purple" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Dashboard Super Admin
              </h2>
              <p className="text-muted-foreground">
                Vista general de toda la plataforma SweetSpot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats - Use server-rendered component */}
      <PlatformStats />

      {/* Platform Management Tabs */}
      <div className="mt-12">
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-brand-purple text-brand-purple font-medium text-sm">
              Gestión de Coworks
            </div>
          </nav>
        </div>
        
        {/* Cowork Management */}
        <CoworkManagement />
      </div>

      {/* User Management Section */}
      <div className="mt-12">
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-brand-purple text-brand-purple font-medium text-sm">
              Gestión de Usuarios
            </div>
          </nav>
        </div>
        
        {/* User Management */}
        <UserManagement />
      </div>
    </main>
  );
}

// Regular Cowork Dashboard with Purple Gradient Design
function CoworkDashboard({ 
  dashboardData, 
  showCreateLeadModal, 
  setShowCreateLeadModal 
}: { 
  dashboardData: any;
  showCreateLeadModal: boolean;
  setShowCreateLeadModal: (value: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState('crm')
  const [quickViewData, setQuickViewData] = useState<any>(null)
  const [quickViewType, setQuickViewType] = useState<'prospect' | 'client' | 'opportunity' | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Function to open quick view modal
  const openQuickView = (data: any, type: 'prospect' | 'client' | 'opportunity') => {
    setQuickViewData(data)
    setQuickViewType(type)
    setShowQuickView(true)
  }

  const closeQuickView = () => {
    setShowQuickView(false)
    setQuickViewData(null)
    setQuickViewType(null)
  }

  // Function to get quick actions based on active tab
  const getQuickActions = () => {
    switch (activeTab) {
      case 'crm':
        return [
          { icon: UserCheck, label: 'Crear Prospecto', action: () => setShowCreateLeadModal(true) },
          { icon: Target, label: 'Crear Oportunidad', action: () => window.location.href = '/opportunities/create' },
          { icon: Building2, label: 'Crear Cliente', action: () => window.location.href = '/clients/create' },
          { separator: true },
          { icon: Users, label: 'Ver Prospectos', action: () => window.location.href = '/leads' },
          { icon: Target, label: 'Ver Oportunidades', action: () => window.location.href = '/opportunities' },
          { icon: Building2, label: 'Ver Clientes', action: () => window.location.href = '/clients' },
        ]
      case 'operacion':
        return [
          { icon: Calendar, label: 'Nueva Reserva', action: () => window.location.href = '/bookings/create' },
          { icon: Building2, label: 'Gestionar Espacios', action: () => window.location.href = '/spaces' },
          { icon: Users, label: 'Gestionar Miembros', action: () => window.location.href = '/members' },
          { separator: true },
          { icon: Calendar, label: 'Ver Reservas', action: () => window.location.href = '/bookings' },
          { icon: Settings, label: 'Configuración', action: () => window.location.href = '/settings' },
        ]
      case 'analitica':
        return [
          { icon: BarChart3, label: 'Reporte de Ventas', action: () => window.location.href = '/reports/sales' },
          { icon: TrendingUp, label: 'Métricas CRM', action: () => window.location.href = '/reports/crm' },
          { icon: Users, label: 'Análisis de Clientes', action: () => window.location.href = '/reports/clients' },
          { separator: true },
          { icon: FileText, label: 'Exportar Datos', action: () => window.location.href = '/reports/export' },
        ]
      case 'facturacion':
        return [
          { icon: FileText, label: 'Nueva Factura', action: () => window.location.href = '/invoices/create' },
          { icon: DollarSign, label: 'Crear Pago', action: () => window.location.href = '/payments/create' },
          { icon: Calendar, label: 'Programar Pago', action: () => window.location.href = '/payments/schedule' },
          { separator: true },
          { icon: FileText, label: 'Ver Facturas', action: () => window.location.href = '/invoices' },
          { icon: DollarSign, label: 'Historial de Pagos', action: () => window.location.href = '/payments' },
        ]
      default:
        return []
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Cowork Header with Purple Gradient */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Dashboard SweetSpot
                  </h2>
                  <p className="text-purple-100 text-lg">
                    Gestiona tu coworking de manera integral
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center text-purple-100">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Actualizado hace 5 min</span>
                    </div>
                    <div className="flex items-center text-purple-100">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Sistema activo</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg">
                      <Zap className="h-4 w-4 mr-2" />
                      <span>Acciones Rápidas</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {getQuickActions().map((action, index) => {
                      if (action.separator) {
                        return <DropdownMenuSeparator key={`separator-${index}`} />
                      }
                      const IconComponent = action.icon
                      return (
                        <DropdownMenuItem key={index} onClick={action.action}>
                          <IconComponent className="h-4 w-4 mr-2" />
                          {action.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-24 w-24 rounded-full bg-white/5"></div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="crm" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-xl p-1">
          <TabsTrigger value="crm" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Target className="h-4 w-4" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="operacion" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Operación
          </TabsTrigger>
          <TabsTrigger value="analitica" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Analítica
          </TabsTrigger>
          <TabsTrigger value="facturacion" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4" />
            Facturación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-6">
          <CRMTab dashboardData={dashboardData} openQuickView={openQuickView} />
        </TabsContent>

        <TabsContent value="operacion" className="mt-6">
          <OperacionTab />
        </TabsContent>

        <TabsContent value="analitica" className="mt-6">
          <AnaliticaTab />
        </TabsContent>

        <TabsContent value="facturacion" className="mt-6">
          <FacturacionTab />
        </TabsContent>
      </Tabs>

      {/* Quick View Modal */}
      <QuickViewModal 
        isOpen={showQuickView}
        onClose={closeQuickView}
        data={quickViewData}
        type={quickViewType!}
      />
    </main>
  )
}

// CRM Tab Component
function CRMTab({ dashboardData, openQuickView }: { dashboardData: any; openQuickView: (data: any, type: 'prospect' | 'client' | 'opportunity') => void }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">

      {/* Enhanced CRM Stats Grid with Purple Gradient Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-purple hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Oportunidades Activas</p>
                <p className="text-3xl font-bold text-purple-900">{dashboardData?.opportunities?.stats?.active || 0}</p>
                <p className="text-xs text-purple-600 flex items-center mt-2">
                  <Target className="h-3 w-3 mr-1" />
                  Pipeline en progreso
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Valor Pipeline</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(dashboardData?.opportunities?.stats?.pipelineValue || 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-2">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Potencial de ingresos
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Clientes Activos</p>
                <p className="text-3xl font-bold text-blue-900">{dashboardData?.clients?.stats?.active || 0}</p>
                <p className="text-xs text-blue-600 flex items-center mt-2">
                  <Building2 className="h-3 w-3 mr-1" />
                  Empresas registradas
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Prospectos Nuevos</p>
                <p className="text-3xl font-bold text-orange-900">{dashboardData?.leads?.stats?.new || 0}</p>
                <p className="text-xs text-orange-600 flex items-center mt-2">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Este mes
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Leads Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Gestión de Prospectos</CardTitle>
                  <p className="text-blue-100 mt-1">Nuevos leads y oportunidades de conversión</p>
                </div>
              </div>
              <Link href="/leads">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Ver Todos los Prospectos
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{dashboardData?.leads?.stats?.total || 0}</span>
                  <p className="text-sm text-blue-600 font-medium mt-1">Total Prospectos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">{dashboardData?.leads?.stats?.new || 0}</span>
                  <p className="text-sm text-amber-600 font-medium mt-1">Nuevos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{dashboardData?.leads?.stats?.qualified || 0}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Calificados</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-900">{dashboardData?.leads?.stats?.converted || 0}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Convertidos</p>
                </div>
              </div>
            </div>

            {/* Recent Leads with Enhanced Design */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Star className="h-5 w-5 text-blue-600 mr-2" />
                Prospectos Prioritarios
              </h4>
              <div className="space-y-4">
                {(dashboardData?.leads?.recent || []).map((lead: any) => (
                  <div 
                    key={lead.id} 
                    className="bg-gradient-to-r from-white to-blue-50/50 border border-blue-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => openQuickView(lead, 'prospect')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <UserCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{lead.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {lead.email}
                            </span>
                            {lead.company && (
                              <span className="flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />
                                {lead.company}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Registrado: {new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${
                            lead.status === 'NEW' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300' :
                            lead.status === 'QUALIFIED' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300' :
                            'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
                          } text-xs font-medium px-3 py-1`}>
                            {lead.status === 'NEW' ? 'Nuevo' : 
                             lead.status === 'QUALIFIED' ? 'Calificado' : 'Contactado'}
                          </Badge>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          Score: {lead.score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/leads">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors">
                    Ver todos los prospectos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Opportunities Section with Purple Gradient Design */}
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Pipeline de Oportunidades</CardTitle>
                  <p className="text-purple-100 mt-1">Gestiona tu pipeline de ventas y oportunidades de negocio</p>
                </div>
              </div>
              <Link href="/opportunities">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Target className="h-4 w-4 mr-2" />
                  Ver Pipeline Completo
                </Button>
              </Link>
            </div>
          </CardHeader>
          
          {/* Enhanced Opportunities Stats */}
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-900">{dashboardData?.opportunities?.stats?.total || 0}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Total Oportunidades</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{dashboardData?.opportunities?.stats?.active || 0}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Activas</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-900">{dashboardData?.opportunities?.stats?.thisMonth || 0}</span>
                  <p className="text-sm text-orange-600 font-medium mt-1">Este Mes</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(dashboardData?.opportunities?.stats?.pipelineValue || 0)}
                  </span>
                  <p className="text-sm text-emerald-600 font-medium mt-1">Valor Pipeline</p>
                </div>
              </div>
            </div>
            
            {/* Recent Opportunities with Enhanced Design */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Star className="h-5 w-5 text-purple-600 mr-2" />
                Oportunidades Destacadas
              </h4>
              <div className="space-y-4">
                {(dashboardData?.opportunities?.recent || []).length === 0 ? (
                  <div className="text-center py-8 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border border-purple-100 rounded-xl">
                    <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No hay oportunidades creadas aún</p>
                    <p className="text-sm text-gray-500 mt-1">Comienza creando tu primera oportunidad de negocio</p>
                    <Link href="/opportunities">
                      <Button className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Oportunidad
                      </Button>
                    </Link>
                  </div>
                ) : (
                  (dashboardData?.opportunities?.recent || []).map((opportunity: any) => (
                  <div 
                    key={opportunity.id} 
                    className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => openQuickView(opportunity, 'opportunity')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{opportunity.title}</p>
                          <p className="text-purple-600 font-medium">
                            {opportunity.client?.name || 
                             (opportunity.lead ? `${opportunity.lead.firstName} ${opportunity.lead.lastName}` : 'Sin cliente')}
                          </p>
                          <p className="text-sm text-gray-500">Cierre esperado: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(opportunity.value)}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`${
                            opportunity.stage === 'NEGOTIATION' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300' :
                            opportunity.stage === 'PROPOSAL_SENT' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300' :
                            opportunity.stage === 'CONTRACT_REVIEW' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
                          } text-xs font-medium px-3 py-1`}>
                            {opportunity.stage === 'NEGOTIATION' ? 'Negociación' :
                             opportunity.stage === 'PROPOSAL_SENT' ? 'Propuesta Enviada' :
                             opportunity.stage === 'CONTRACT_REVIEW' ? 'Revisión Contrato' :
                             opportunity.stage}
                          </Badge>
                          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {opportunity.probability}% probabilidad
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
              <div className="mt-6 text-center">
                <Link href="/opportunities">
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors">
                    Ver todas las oportunidades
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Clients Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Gestión de Clientes</CardTitle>
                  <p className="text-purple-100 mt-1">Administra tus clientes y empresas activas</p>
                </div>
              </div>
              <Link href="/clients">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Building2 className="h-4 w-4 mr-2" />
                  Ver Todos los Clientes
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-900">{dashboardData?.clients?.stats?.total || 0}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Total Clientes</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{dashboardData?.clients?.stats?.active || 0}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Activos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">{dashboardData?.clients?.stats?.prospects || 0}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Prospectos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{dashboardData?.clients?.stats?.conversionRate || 0}%</span>
                  <p className="text-sm text-blue-600 font-medium mt-1">Conversión</p>
                </div>
              </div>
            </div>

            {/* Recent Clients with Enhanced Design */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Star className="h-5 w-5 text-purple-600 mr-2" />
                Clientes Destacados
              </h4>
              <div className="space-y-4">
                {(dashboardData?.clients?.recent || []).length === 0 ? (
                  <div className="text-center py-8 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-100 rounded-xl">
                    <Building2 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No hay clientes registrados aún</p>
                    <p className="text-sm text-gray-500 mt-1">Comienza agregando tu primer cliente</p>
                    <Link href="/clients">
                      <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Cliente
                      </Button>
                    </Link>
                  </div>
                ) : (
                  (dashboardData?.clients?.recent || []).map((client: any) => (
                  <div 
                    key={client.id} 
                    className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => openQuickView(client, 'client')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{client.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </span>
                            {client.contactPerson && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {client.contactPerson}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Registrado: {new Date(client.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${
                            client.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300' :
                            client.status === 'PROSPECT' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
                          } text-xs font-medium px-3 py-1`}>
                            {client.status === 'ACTIVE' ? 'Activo' : 
                             client.status === 'PROSPECT' ? 'Prospecto' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {client.opportunitiesCount} oportunidad{client.opportunitiesCount !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
              <div className="mt-6 text-center">
                <Link href="/clients">
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors">
                    Ver todos los clientes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// Operacion Tab Component
function OperacionTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="h-5 w-5" />
              Espacios de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disponibles:</span>
                <span className="font-bold text-2xl text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ocupados:</span>
                <span className="font-bold text-2xl text-green-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasa Ocupación:</span>
                <span className="font-bold text-lg text-purple-600">67%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Calendar className="h-5 w-5" />
              Reservas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmadas:</span>
                <span className="font-bold text-2xl text-green-600">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendientes:</span>
                <span className="font-bold text-2xl text-orange-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Check-ins:</span>
                <span className="font-bold text-lg text-blue-600">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Users className="h-5 w-5" />
              Miembros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Presentes:</span>
                <span className="font-bold text-2xl text-orange-600">25</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Membresías:</span>
                <span className="font-bold text-2xl text-purple-600">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nuevos:</span>
                <span className="font-bold text-lg text-green-600">5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Gestión Operativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Configurar Espacios</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Gestionar Reservas</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Administrar Miembros</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
              <div className="text-center">
                <Bell className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Notificaciones</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Analitica Tab Component
function AnaliticaTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BarChart3 className="h-5 w-5" />
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">$12,500,000</div>
            <p className="text-sm text-purple-600 mt-1">+15% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              Tasa de Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">78%</div>
            <p className="text-sm text-green-600 mt-1">+5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5" />
              Retención de Miembros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">92%</div>
            <p className="text-sm text-blue-600 mt-1">+3% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Star className="h-5 w-5" />
              Satisfacción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">4.8/5</div>
            <p className="text-sm text-orange-600 mt-1">Basado en 150 reseñas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Reportes y Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">Reporte Financiero</div>
              </div>
            </Button>
            <Button className="h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">Análisis de Ocupación</div>
              </div>
            </Button>
            <Button className="h-20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">Comportamiento de Usuarios</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Facturacion Tab Component
function FacturacionTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <DollarSign className="h-5 w-5" />
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">$8,750,000</div>
            <p className="text-sm text-green-600 mt-1">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Facturas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">15</div>
            <p className="text-sm text-blue-600 mt-1">$2,300,000 en total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Pagos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">3</div>
            <p className="text-sm text-orange-600 mt-1">$450,000 en total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5" />
              Tasa de Cobro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">94%</div>
            <p className="text-sm text-purple-600 mt-1">Promedio mensual</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Gestión de Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Crear Factura</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <div className="text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Registrar Pago</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Seguimiento</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <div className="text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Reportes</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Facturas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-semibold text-green-900">Factura #001-2024</p>
                <p className="text-sm text-green-600">Empresa ABC - Membresía Premium</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-900">$850,000</div>
                <Badge className="bg-green-100 text-green-800">Pagada</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-semibold text-blue-900">Factura #002-2024</p>
                <p className="text-sm text-blue-600">StartupXYZ - Oficina Privada</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-900">$1,200,000</div>
                <Badge className="bg-blue-100 text-blue-800">Pendiente</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
              <div>
                <p className="font-semibold text-orange-900">Factura #003-2024</p>
                <p className="text-sm text-orange-600">Tech Solutions - Sala de Reuniones</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-900">$450,000</div>
                <Badge className="bg-orange-100 text-orange-800">Vencida</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}