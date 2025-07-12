"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Plus,
  Eye,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useCoworkContextOptional } from "@/contexts/cowork-context";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const api = useApi();
  const { user, isAuthenticated } = useAuth();
  const coworkContext = useCoworkContextOptional();

  useEffect(() => {
    console.log('SuperAdminDashboard - Auth Status:', {
      isAuthenticated,
      user: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
      hasAccessToken: !!localStorage.getItem('access_token'),
      hasSessionToken: !!localStorage.getItem('sweetspot-session'),
      authStoreToken: !!useAuthStore.getState().accessToken
    });
    
    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      loadSystemStats();
    } else {
      console.log('⚠️ User not authenticated or not super admin, skipping stats load');
    }
  }, [isAuthenticated, user]);


  const loadSystemStats = async () => {
    try {
      setLoading(true);
      console.log('Loading system analytics for Super Admin dashboard...');
      
      const response = await api.get('/api/super-admin/analytics');
      
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        throw new Error(errorData.error?.message || errorData.message || 'Error al cargar estadísticas del sistema');
      }

      const data = await response.json();
      console.log('System analytics loaded:', data);
      
      if (data.success && data.data?.overview) {
        setStats(data.data.overview);
      } else if (data.overview) {
        // Handle direct response format
        setStats(data.overview);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast({
        title: "Error al cargar dashboard",
        description: error instanceof Error ? error.message : "No se pudieron cargar las estadísticas del sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'SUSPENDED': return <Clock className="h-4 w-4" />;
      case 'INACTIVE': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard del Sistema</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Mode Indicator */}
      {coworkContext?.isSuperAdminWithoutCowork && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Modo Super Admin Global Activo</h3>
              <p className="text-sm text-purple-700">
                Estás operando como Super Admin sin cowork asignado. Tienes acceso completo a todas las funciones del sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard del Sistema</h1>
          <p className="text-gray-600 mt-1">Vista general de todos los coworks y métricas del sistema</p>
        </div>
        <div className="flex gap-3">
          <Link href="/super-admin/coworks">
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              Ver Coworks
            </Button>
          </Link>
          <Link href="/super-admin/coworks/create">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Cowork
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Coworks</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.totalTenants || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Coworks Activos</p>
                <p className="text-3xl font-bold text-green-900">{stats?.activeTenants || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Usuarios</p>
                <p className="text-3xl font-bold text-purple-900">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Ingresos Totales</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Suspendidos</p>
                <p className="text-2xl font-bold text-yellow-900">{stats?.suspendedTenants || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Inactivos</p>
                <p className="text-2xl font-bold text-red-900">{stats?.inactiveTenants || 0}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-indigo-900">{stats?.totalClients || 0}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Coworks Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentTenants && stats.recentTenants.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">/{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(tenant.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(tenant.status)}
                        {tenant.status}
                      </span>
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(tenant.createdAt)}
                    </span>
                    <Link href={`/super-admin/coworks/${tenant.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay coworks recientes para mostrar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}