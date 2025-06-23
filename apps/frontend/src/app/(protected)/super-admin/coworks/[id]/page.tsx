"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ArrowLeft,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  FileText,
  Shield,
  Activity,
  Database,
  Settings,
  CreditCard,
  UserPlus,
  Home,
  Briefcase,
  Package,
  Plus,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import Link from "next/link";

interface Cowork {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  settings?: {
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
  // Statistics
  _count?: {
    users: number;
    clients: number;
    spaces: number;
    bookings: number;
    invoices: number;
  };
  // Financial summary
  financialSummary?: {
    totalRevenue: number;
    monthlyRevenue: number;
    outstandingPayments: number;
    activeSubscriptions: number;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  _count?: {
    users: number;
  };
}

export default function CoworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cowork, setCowork] = useState<Cowork | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();
  const api = useApi();
  const confirm = useConfirm();

  useEffect(() => {
    if (params.id) {
      loadCoworkDetails();
    }
  }, [params.id]);

  useEffect(() => {
    // Load additional data based on active tab
    if (params.id && activeTab === "users") {
      loadCoworkUsers();
    } else if (params.id && activeTab === "clients") {
      loadCoworkClients();
    }
  }, [params.id, activeTab]);

  const loadCoworkDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading cowork details for:', params.id);

      const response = await api.get(`/api/super-admin/coworks/${params.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar detalles del cowork');
      }

      const data = await response.json();
      console.log('Cowork details loaded:', data);

      if (data.success && data.data) {
        // Map the backend response to our Cowork interface
        const coworkData = data.data.cowork;
        const stats = data.data.stats;
        
        setCowork({
          ...coworkData,
          financialSummary: {
            totalRevenue: stats.recentActivity.monthlyRevenue,
            monthlyRevenue: stats.recentActivity.monthlyRevenue,
            outstandingPayments: 0, // Not provided by backend yet
            activeSubscriptions: 0, // Not provided by backend yet
          }
        });
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error loading cowork details:', error);
      toast({
        title: "Error al cargar detalles",
        description: error instanceof Error ? error.message : "No se pudieron cargar los detalles del cowork",
        variant: "destructive",
      });
      router.push('/super-admin/coworks');
    } finally {
      setLoading(false);
    }
  };

  const loadCoworkUsers = async () => {
    try {
      console.log('Loading users for cowork:', params.id);

      const response = await api.get(`/api/super-admin/coworks/${params.id}/users`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar usuarios');
      }

      const data = await response.json();
      console.log('Users loaded:', data);

      if (data.success && data.data) {
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error al cargar usuarios",
        description: error instanceof Error ? error.message : "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  };

  const loadCoworkClients = async () => {
    try {
      console.log('Loading clients for cowork:', params.id);

      const response = await api.get(`/api/super-admin/coworks/${params.id}/clients`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar clientes');
      }

      const data = await response.json();
      console.log('Clients loaded:', data);

      if (data.success && data.data) {
        setClients(data.data.clients || []);
      } else {
        // Handle the placeholder response from backend
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error al cargar clientes",
        description: error instanceof Error ? error.message : "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const handleSuspendCowork = async () => {
    if (!cowork) return;

    const confirmed = await confirm({
      title: "Suspender Cowork",
      description: `¿Estás seguro de que quieres suspender "${cowork.name}"? Los usuarios no podrán acceder hasta que se reactive.`,
      confirmText: "Suspender",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading('suspend');
      console.log(`Suspending cowork: ${cowork.name}`);

      const response = await api.put(`/api/super-admin/coworks/${cowork.id}/suspend`, {
        reason: "Suspendido desde panel de Super Admin",
        notifyUsers: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al suspender cowork');
      }

      toast({
        title: "Cowork suspendido",
        description: `"${cowork.name}" ha sido suspendido exitosamente`,
      });

      // Refresh the details
      await loadCoworkDetails();
    } catch (error) {
      console.error('Error suspending cowork:', error);
      toast({
        title: "Error al suspender",
        description: error instanceof Error ? error.message : "No se pudo suspender el cowork",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateCowork = async () => {
    if (!cowork) return;

    const confirmed = await confirm({
      title: "Activar Cowork",
      description: `¿Estás seguro de que quieres activar "${cowork.name}"?`,
      confirmText: "Activar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading('activate');
      console.log(`Activating cowork: ${cowork.name}`);

      const response = await api.put(`/api/super-admin/coworks/${cowork.id}/activate`, {
        reason: "Activado desde panel de Super Admin",
        notifyUsers: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al activar cowork');
      }

      toast({
        title: "Cowork activado",
        description: `"${cowork.name}" ha sido activado exitosamente`,
      });

      // Refresh the details
      await loadCoworkDetails();
    } catch (error) {
      console.error('Error activating cowork:', error);
      toast({
        title: "Error al activar",
        description: error instanceof Error ? error.message : "No se pudo activar el cowork",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCowork = async () => {
    if (!cowork) return;

    const confirmed = await confirm({
      title: "Eliminar Cowork",
      description: `¿Estás seguro de que quieres eliminar "${cowork.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading('delete');
      console.log(`Deleting cowork: ${cowork.name}`);

      const response = await api.delete(`/api/super-admin/coworks/${cowork.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar cowork');
      }

      toast({
        title: "Cowork eliminado",
        description: `"${cowork.name}" ha sido eliminado exitosamente`,
      });

      // Redirect to coworks list
      router.push('/super-admin/coworks');
    } catch (error) {
      console.error('Error deleting cowork:', error);
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el cowork",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: cowork?.settings?.currency || 'CLP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cowork) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/coworks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Coworks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cowork.name}</h1>
            <p className="text-gray-600">/{cowork.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(cowork.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(cowork.status)}
              {cowork.status}
            </span>
          </Badge>
          <Button
            variant="outline"
            onClick={() => loadCoworkDetails()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/super-admin/coworks/${cowork.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              {cowork.status === 'ACTIVE' && (
                <DropdownMenuItem 
                  onClick={handleSuspendCowork}
                  className="text-yellow-600"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Suspender
                </DropdownMenuItem>
              )}
              {cowork.status !== 'ACTIVE' && (
                <DropdownMenuItem 
                  onClick={handleActivateCowork}
                  className="text-green-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Activar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteCowork}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold">{cowork._count?.users || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="text-2xl font-bold">{cowork._count?.clients || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Instalaciones</p>
                <p className="text-2xl font-bold">{cowork._count?.spaces || 0}</p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cowork.financialSummary?.monthlyRevenue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="overview">Información General</TabsTrigger>
              <TabsTrigger value="users">Usuarios ({cowork._count?.users || 0})</TabsTrigger>
              <TabsTrigger value="clients">Clientes ({cowork._count?.clients || 0})</TabsTrigger>
              <TabsTrigger value="financial">Información Financiera</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{cowork.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Slug</p>
                      <p className="font-medium">/{cowork.slug}</p>
                    </div>
                    {cowork.domain && (
                      <div>
                        <p className="text-sm text-gray-500">Dominio</p>
                        <p className="font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a href={`https://${cowork.domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {cowork.domain}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {cowork.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${cowork.email}`} className="text-blue-600 hover:underline">
                            {cowork.email}
                          </a>
                        </p>
                      </div>
                    )}
                    {cowork.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${cowork.phone}`} className="text-blue-600 hover:underline">
                            {cowork.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    {cowork.address && (
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {cowork.address}
                          {cowork.city && `, ${cowork.city}`}
                          {cowork.country && `, ${cowork.country}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {cowork.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Descripción</p>
                    <p className="font-medium mt-1">{cowork.description}</p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Estadísticas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{cowork._count?.users || 0}</p>
                    <p className="text-sm text-gray-600">Usuarios</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{cowork._count?.clients || 0}</p>
                    <p className="text-sm text-gray-600">Clientes</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{cowork._count?.spaces || 0}</p>
                    <p className="text-sm text-gray-600">Instalaciones</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{cowork._count?.bookings || 0}</p>
                    <p className="text-sm text-gray-600">Reservas</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{cowork._count?.invoices || 0}</p>
                    <p className="text-sm text-gray-600">Facturas</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Información Temporal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Creado</p>
                    <p className="font-medium">{formatDate(cowork.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última actualización</p>
                    <p className="font-medium">{formatDate(cowork.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    Usuarios del Cowork
                  </h3>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Usuario
                  </Button>
                </div>
                
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{user.role}</Badge>
                              <Badge className={user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600">No hay usuarios registrados</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="clients" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                    Clientes del Cowork
                  </h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cliente
                  </Button>
                </div>
                
                {clients.length > 0 ? (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <Card key={client.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                {client.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </span>
                                )}
                                {client.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {client.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {client._count?.users || 0} usuarios
                                </span>
                              </div>
                            </div>
                            <Badge className={client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {client.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600">No hay clientes registrados</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financial" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  Resumen Financiero
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ingresos Totales</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(cowork.financialSummary?.totalRevenue || 0)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(cowork.financialSummary?.monthlyRevenue || 0)}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pagos Pendientes</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(cowork.financialSummary?.outstandingPayments || 0)}
                          </p>
                        </div>
                        <CreditCard className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Suscripciones Activas</p>
                          <p className="text-xl font-bold">
                            {cowork.financialSummary?.activeSubscriptions || 0}
                          </p>
                        </div>
                        <Package className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte Financiero
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Exportar Transacciones
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Configuración del Cowork
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Moneda</p>
                      <p className="font-medium">{cowork.settings?.currency || 'CLP'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Zona Horaria</p>
                      <p className="font-medium">{cowork.settings?.timezone || 'America/Santiago'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Formato de Fecha</p>
                      <p className="font-medium">{cowork.settings?.dateFormat || 'DD/MM/YYYY'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Idioma</p>
                      <p className="font-medium">{cowork.settings?.language || 'es-CL'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Link href={`/super-admin/coworks/${cowork.id}/settings`}>
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Configuración
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Ver Logs de Auditoría
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Configurar Seguridad
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Backup de Datos
            </Button>
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Notificación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}