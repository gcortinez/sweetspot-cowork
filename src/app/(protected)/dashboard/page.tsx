'use client'

import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
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
  CheckCircle
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

  // Mock data for demonstration
  const coworkData = {
    stats: {
      todayBookings: 12,
      activeMembers: 145,
      occupancy: 85,
      monthlyRevenue: 125000
    },
    recentBookings: [
      {
        id: 1,
        space: "Sala de Conferencias A",
        client: "Tech Startup Inc.",
        time: "10:00 AM - 12:00 PM",
        status: "Confirmada"
      },
      {
        id: 2,
        space: "Oficina Privada 5",
        client: "Digital Agency",
        time: "2:00 PM - 6:00 PM",
        status: "En Progreso"
      },
      {
        id: 3,
        space: "Escritorio Flexible #12",
        client: "Freelancer Juan",
        time: "9:00 AM - 5:00 PM",
        status: "Confirmada"
      }
    ],
    activities: [
      { id: 1, type: 'booking', text: 'Nueva reserva confirmada', time: 'Hace 5 min' },
      { id: 2, type: 'payment', text: 'Pago recibido', time: 'Hace 1 hora' },
      { id: 3, type: 'member', text: 'Nuevo miembro registrado', time: 'Hace 2 horas' },
      { id: 4, type: 'space', text: 'Espacio actualizado', time: 'Hace 3 horas' }
    ],
    opportunities: {
      stats: {
        total: 12,
        active: 8,
        thisMonth: 4,
        pipelineValue: 45000000
      },
      recent: [
        {
          id: 1,
          title: "Oficina Privada - Tech Startup",
          value: 15000000,
          probability: 75,
          stage: "NEGOTIATION",
          client: "Tech Startup Inc.",
          expectedCloseDate: "2024-02-15"
        },
        {
          id: 2,
          title: "Espacios Flexibles - Agencia Digital",
          value: 8500000,
          probability: 60,
          stage: "PROPOSAL_SENT",
          client: "Digital Agency Co.",
          expectedCloseDate: "2024-02-28"
        },
        {
          id: 3,
          title: "Sala de Conferencias - Consultora",
          value: 12000000,
          probability: 90,
          stage: "CONTRACT_REVIEW",
          client: "Consultora Ágil SAS",
          expectedCloseDate: "2024-02-10"
        }
      ]
    },
    leads: {
      stats: {
        total: 18,
        new: 7,
        qualified: 5,
        converted: 2
      },
      recent: [
        {
          id: 1,
          name: "María González",
          email: "maria@startup.cl",
          company: "Startup Innovadora",
          status: "NEW",
          score: 92,
          source: "WEBSITE",
          createdAt: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          name: "Juan Pérez",
          email: "juan@empresa.com", 
          company: "Tech Solutions",
          status: "QUALIFIED",
          score: 85,
          source: "REFERRAL",
          createdAt: "2024-01-14T14:20:00Z"
        },
        {
          id: 3,
          name: "Pedro Martínez",
          email: "pedro@consultora.com",
          company: "Consultora Ágil",
          status: "CONTACTED",
          score: 78,
          source: "SOCIAL_MEDIA",
          createdAt: "2024-01-13T16:45:00Z"
        }
      ]
    },
    clients: {
      stats: {
        total: 32,
        active: 24,
        prospects: 8,
        inactive: 4,
        conversionRate: 68
      },
      recent: [
        {
          id: 1,
          name: "Tech Innovators SAS",
          email: "contacto@techinnovators.co",
          contactPerson: "Ana García",
          status: "ACTIVE",
          createdAt: "2024-01-10T09:15:00Z",
          opportunitiesCount: 3
        },
        {
          id: 2,
          name: "Digital Solutions Ltd",
          email: "info@digitalsolutions.com",
          contactPerson: "Carlos Ruiz",
          status: "PROSPECT",
          createdAt: "2024-01-12T14:30:00Z",
          opportunitiesCount: 1
        },
        {
          id: 3,
          name: "Startup Unicornio",
          email: "hola@startupunicornio.io",
          contactPerson: "Laura Martínez",
          status: "ACTIVE",
          createdAt: "2024-01-08T11:45:00Z",
          opportunitiesCount: 2
        }
      ]
    }
  };

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
                  {!isLoadingCoworks && (
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
                        selectedCowork ? (
                          <span className="text-indigo-600 font-medium">{selectedCowork.name}</span>
                        ) : (
                          <span className="text-gray-500">Cargando...</span>
                        )
                      )}
                    </div>
                  )}
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
                <Link href="/opportunities">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <Target className="h-4 w-4 mr-2" />
                    Oportunidades
                  </Button>
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/leads">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Prospectos
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
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nueva Oportunidad
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isSuperAdmin ? (
        <SuperAdminDashboard coworkData={coworkData} />
      ) : (
        <CoworkDashboard coworkData={coworkData} />
      )}
    </div>
  );
}

// Super Admin Dashboard with platform view
function SuperAdminDashboard({ coworkData }: { coworkData: any }) {
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
function CoworkDashboard({ coworkData }: { coworkData: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
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
                    Dashboard CRM
                  </h2>
                  <p className="text-purple-100 text-lg">
                    Gestiona tu pipeline de ventas y oportunidades
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
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg">
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Acciones Rápidas</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-24 w-24 rounded-full bg-white/5"></div>
        </div>
      </div>

      {/* Enhanced CRM Stats Grid with Purple Gradient Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-purple hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Oportunidades Activas</p>
                <p className="text-3xl font-bold text-purple-900">{coworkData.opportunities.stats.active}</p>
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
                  {formatCurrency(coworkData.opportunities.stats.pipelineValue)}
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
                <p className="text-3xl font-bold text-blue-900">{coworkData.clients.stats.active}</p>
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
                <p className="text-3xl font-bold text-orange-900">{coworkData.leads.stats.new}</p>
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
                  <span className="text-2xl font-bold text-blue-900">{coworkData.leads.stats.total}</span>
                  <p className="text-sm text-blue-600 font-medium mt-1">Total Prospectos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">{coworkData.leads.stats.new}</span>
                  <p className="text-sm text-amber-600 font-medium mt-1">Nuevos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{coworkData.leads.stats.qualified}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Calificados</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-900">{coworkData.leads.stats.converted}</span>
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
                {coworkData.leads.recent.map((lead: any) => (
                  <div key={lead.id} className="bg-gradient-to-r from-white to-blue-50/50 border border-blue-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
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
                  <span className="text-2xl font-bold text-purple-900">{coworkData.clients.stats.total}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Total Clientes</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{coworkData.clients.stats.active}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Activos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">{coworkData.clients.stats.prospects}</span>
                  <p className="text-sm text-amber-600 font-medium mt-1">Prospectos</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{coworkData.clients.stats.conversionRate}%</span>
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
                {coworkData.clients.recent.map((client: any) => (
                  <div key={client.id} className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
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
                ))}
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
                  <span className="text-2xl font-bold text-purple-900">{coworkData.opportunities.stats.total}</span>
                  <p className="text-sm text-purple-600 font-medium mt-1">Total Oportunidades</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{coworkData.opportunities.stats.active}</span>
                  <p className="text-sm text-green-600 font-medium mt-1">Activas</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-900">{coworkData.opportunities.stats.thisMonth}</span>
                  <p className="text-sm text-orange-600 font-medium mt-1">Este Mes</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(coworkData.opportunities.stats.pipelineValue)}
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
                {coworkData.opportunities.recent.map((opportunity: any) => (
                  <div key={opportunity.id} className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{opportunity.title}</p>
                          <p className="text-purple-600 font-medium">{opportunity.client}</p>
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
                ))}
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

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">Actividad Reciente</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {coworkData.recentBookings.map((booking: any) => (
                  <div key={booking.id} className="bg-gradient-to-r from-white to-indigo-50/50 border border-indigo-100 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.space}</p>
                          <p className="text-sm text-gray-600">{booking.client}</p>
                          <p className="text-xs text-gray-500">{booking.time}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        booking.status === 'Confirmada' 
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
                      } font-medium`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Enhanced Quick Actions */}
          <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <Calendar className="h-4 w-4 mr-3" />
                  Nueva Reserva
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <Users className="h-4 w-4 mr-3" />
                  Agregar Miembro
                </Button>
                <Link href="/clients" className="block w-full">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <Building2 className="h-4 w-4 mr-3" />
                    Gestionar Clientes
                  </Button>
                </Link>
                <Link href="/leads" className="block w-full">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <UserCheck className="h-4 w-4 mr-3" />
                    Gestionar Prospectos
                  </Button>
                </Link>
                <Link href="/opportunities" className="block w-full">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <Target className="h-4 w-4 mr-3" />
                    Pipeline de Oportunidades
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Ver Reportes
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Recent Activity */}
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {coworkData.activities.map((activity: any) => (
                  <div key={activity.id} className="bg-gradient-to-r from-white to-indigo-50/50 border border-indigo-100 rounded-lg p-3 hover:shadow-sm transition-all">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                  <Bell className="h-4 w-4 mr-2" />
                  Ver todas las notificaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}