"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
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
  Bell
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No autenticado</p>
        </div>
      </div>
    );
  }

  // Check if user has super admin metadata
  const isSuperAdmin = user.publicMetadata?.role === 'SUPER_ADMIN';
  const userRole = user.publicMetadata?.role || 'END_USER';

  // Mock data that changes based on role
  const dashboardData = {
    stats: {
      todayBookings: isSuperAdmin ? 145 : 12,
      activeMembers: isSuperAdmin ? 2450 : 145,
      occupancy: 85,
      monthlyRevenue: isSuperAdmin ? 875000 : 125000
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
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SweetSpot</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-500">
                {currentTime.toLocaleTimeString('es-ES')}
              </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSuperAdmin ? (
                <Crown className="h-6 w-6 text-purple-600" />
              ) : (
                <Building2 className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Dashboard {isSuperAdmin ? 'Super Admin' : 'Cowork'}
                </h2>
                <p className="text-gray-600">
                  {isSuperAdmin 
                    ? 'Vista general de toda la plataforma SweetSpot'
                    : 'Gestiona tu espacio de coworking'
                  }
                </p>
              </div>
              {isSuperAdmin && (
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Super Admin
                </span>
              )}
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors">
              <PlusCircle className="h-4 w-4" />
              <span>Nueva Reserva</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                🎉 ¡Dashboard funcionando correctamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>El sistema de autenticación con Clerk está funcionando perfectamente. Todas las dependencias de Supabase han sido eliminadas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.todayBookings}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeMembers.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.occupancy}%</p>
                <p className="text-xs text-gray-500">{Math.floor(dashboardData.stats.occupancy * 0.35)} de 35 espacios</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData.stats.monthlyRevenue.toLocaleString()}
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Todas</button>
            </div>
            <div className="space-y-4">
              {dashboardData.recentBookings.map((booking) => (
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
                <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Reportes
                </button>
                <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </button>
                {isSuperAdmin && (
                  <button className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <Building2 className="h-4 w-4 mr-2" />
                    Gestionar Coworks
                  </button>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                {dashboardData.activities.map((activity) => (
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

        {/* User Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            Información de Usuario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p><strong className="text-blue-800">Email:</strong> <span className="text-blue-700">{user.emailAddresses[0]?.emailAddress}</span></p>
              <p><strong className="text-blue-800">Nombre:</strong> <span className="text-blue-700">{user.firstName} {user.lastName}</span></p>
              <p><strong className="text-blue-800">ID:</strong> <span className="text-blue-700 font-mono text-xs">{user.id}</span></p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-blue-800">Rol:</strong> <span className="text-blue-700">{userRole} {isSuperAdmin ? '👑' : ''}</span></p>
              <p><strong className="text-blue-800">Estado:</strong> <span className="text-green-700">Autenticado ✅</span></p>
              <p><strong className="text-blue-800">Última conexión:</strong> <span className="text-blue-700">{currentTime.toLocaleString('es-ES')}</span></p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-blue-800">Metadatos:</strong> <span className="text-blue-700">{user.publicMetadata ? 'Sí ✅' : 'No ❌'}</span></p>
              <p><strong className="text-blue-800">Email verificado:</strong> <span className="text-blue-700">{user.emailAddresses[0]?.verification?.status === 'verified' ? 'Sí ✅' : 'No ❌'}</span></p>
              <p><strong className="text-blue-800">Versión:</strong> <span className="text-blue-700">Clerk v2.0</span></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}