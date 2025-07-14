import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
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
  Phone
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { CoworkSelector } from "@/components/admin/cowork-selector";
import { PlatformStats } from "@/components/admin/platform-stats";
import { CoworkManagement } from "@/components/admin/cowork-management";
import { UserManagement } from "@/components/admin/user-management";
import { useCoworkSelection } from "@/contexts/cowork-selection-context";

// Server-side dashboard page
export default async function DashboardPage() {
  // Get user on server side
  const user = await currentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Get user role from metadata (check private first, then public)
  const privateMetadata = user.privateMetadata as any;
  const publicMetadata = user.publicMetadata as any;
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  console.log('🚀 SERVER-SIDE DASHBOARD:', {
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

'use client'

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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isSuperAdmin ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                {isSuperAdmin ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <Building2 className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SweetSpot</h1>
                {/* Cowork name display */}
                {!isLoadingCoworks && (
                  <div className="text-sm text-gray-600">
                    {isSuperAdmin ? (
                      isPlatformView ? (
                        <span className="text-purple-600 font-medium">Vista General de la Plataforma</span>
                      ) : (
                        selectedCowork ? (
                          <span className="text-blue-600 font-medium">{selectedCowork.name}</span>
                        ) : (
                          <span className="text-gray-500">Seleccionar Cowork</span>
                        )
                      )
                    ) : (
                      selectedCowork ? (
                        <span className="text-blue-600 font-medium">{selectedCowork.name}</span>
                      ) : (
                        <span className="text-gray-500">Cargando...</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Cowork Selector for Super Admins */}
              {isSuperAdmin && <CoworkSelector />}
              
              {/* User Role Display */}
              {isSuperAdmin ? (
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Super Admin
                </span>
              ) : (
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {user.privateMetadata?.role || user.publicMetadata?.role || 'User'}
                </div>
              )}
              
              <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              
              <div className="text-sm text-gray-600">
                Bienvenido, {user.firstName || user.emailAddresses[0]?.emailAddress}
              </div>
              
              <SignOutButton>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors">
                  Cerrar Sesión
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

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
            <Crown className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dashboard Super Admin
              </h2>
              <p className="text-gray-600">
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
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-purple-500 text-purple-600 font-medium text-sm">
              Gestión de Coworks
            </div>
          </nav>
        </div>
        
        {/* Cowork Management */}
        <CoworkManagement />
      </div>

      {/* User Management Section */}
      <div className="mt-12">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-purple-500 text-purple-600 font-medium text-sm">
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

// Regular Cowork Dashboard
function CoworkDashboard({ coworkData }: { coworkData: any }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cowork Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dashboard Cowork
              </h2>
              <p className="text-gray-600">
                Gestiona tu espacio de coworking
              </p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors">
            <PlusCircle className="h-4 w-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Cowork Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{coworkData.stats.todayBookings}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% vs ayer
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Miembros Activos</p>
              <p className="text-2xl font-bold text-gray-900">{coworkData.stats.activeMembers.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% este mes
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupación</p>
              <p className="text-2xl font-bold text-gray-900">{coworkData.stats.occupancy}%</p>
              <p className="text-xs text-gray-500">{Math.floor(coworkData.stats.occupancy * 0.35)} de 35 espacios</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                ${coworkData.stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% vs mes anterior
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Leads Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestión de Prospectos</h3>
                  <p className="text-sm text-gray-600">Nuevos leads y oportunidades de venta</p>
                </div>
              </div>
              <a 
                href="/leads"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Ver Todos</span>
              </a>
            </div>
          </div>

          {/* Leads Stats */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600 mr-1" />
                  <span className="text-2xl font-bold text-gray-900">{coworkData.leads.stats.total}</span>
                </div>
                <p className="text-sm text-gray-600">Total Prospectos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-yellow-600 mr-1" />
                  <span className="text-2xl font-bold text-yellow-600">{coworkData.leads.stats.new}</span>
                </div>
                <p className="text-sm text-gray-600">Nuevos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-green-600 mr-1" />
                  <span className="text-2xl font-bold text-green-600">{coworkData.leads.stats.qualified}</span>
                </div>
                <p className="text-sm text-gray-600">Calificados</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-1" />
                  <span className="text-2xl font-bold text-purple-600">{coworkData.leads.stats.converted}</span>
                </div>
                <p className="text-sm text-gray-600">Convertidos</p>
              </div>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Prospectos Recientes</h4>
            <div className="space-y-3">
              {coworkData.leads.recent.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'QUALIFIED' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status === 'NEW' ? 'Nuevo' : 
                         lead.status === 'QUALIFIED' ? 'Calificado' : 'Contactado'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Score: {lead.score}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a 
                href="/leads"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
              >
                Ver todos los prospectos
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cowork Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Todas</button>
          </div>
          <div className="space-y-4">
            {coworkData.recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{booking.space}</p>
                  <p className="text-sm text-gray-600">{booking.client}</p>
                  <p className="text-xs text-gray-500">{booking.time}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  booking.status === 'Confirmada' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Calendar className="h-4 w-4 mr-2" />
                Nueva Reserva
              </button>
              <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Users className="h-4 w-4 mr-2" />
                Agregar Miembro
              </button>
              <a 
                href="/leads"
                className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Gestionar Prospectos
              </a>
              <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Reportes
              </button>
              <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              {coworkData.activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}