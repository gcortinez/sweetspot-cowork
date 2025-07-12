"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
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
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface CoworksResponse {
  coworks: Cowork[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CoworksManagement() {
  const [coworks, setCoworks] = useState<Cowork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { toast } = useToast();
  const api = useApi();
  const confirm = useConfirm();

  useEffect(() => {
    loadCoworks();
  }, [pagination.page, statusFilter]);

  const loadCoworks = async (search?: string) => {
    try {
      setLoading(true);
      console.log('Loading coworks for Super Admin...');

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (search || searchTerm) {
        params.append('search', search || searchTerm);
      }

      const response = await api.get(`/api/super-admin/coworks?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar coworks');
      }

      const data = await response.json();
      console.log('Coworks loaded:', data);

      if (data.success && data.data) {
        setCoworks(data.data.coworks);
        setPagination(data.data.pagination);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error loading coworks:', error);
      toast({
        title: "Error al cargar coworks",
        description: error instanceof Error ? error.message : "No se pudieron cargar los coworks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    await loadCoworks(searchTerm);
  };

  const handleSuspendCowork = async (cowork: Cowork) => {
    const confirmed = await confirm({
      title: "Suspender Cowork",
      description: `¿Estás seguro de que quieres suspender "${cowork.name}"? Los usuarios no podrán acceder hasta que se reactive.`,
      confirmText: "Suspender",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading(cowork.id);
      console.log(`Suspending cowork: ${cowork.name}`);

      const response = await api.put(`/api/super-admin/coworks/${cowork.id}/suspend`, {
        reason: "Suspendido desde panel de Super Admin",
        notifyUsers: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al suspender cowork');
      }

      const result = await response.json();
      console.log('Cowork suspended:', result);

      toast({
        title: "Cowork suspendido",
        description: `"${cowork.name}" ha sido suspendido exitosamente`,
      });

      // Refresh the list
      await loadCoworks();
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

  const handleActivateCowork = async (cowork: Cowork) => {
    const confirmed = await confirm({
      title: "Activar Cowork",
      description: `¿Estás seguro de que quieres activar "${cowork.name}"?`,
      confirmText: "Activar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading(cowork.id);
      console.log(`Activating cowork: ${cowork.name}`);

      const response = await api.put(`/api/super-admin/coworks/${cowork.id}/activate`, {
        reason: "Activado desde panel de Super Admin",
        notifyUsers: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al activar cowork');
      }

      const result = await response.json();
      console.log('Cowork activated:', result);

      toast({
        title: "Cowork activado",
        description: `"${cowork.name}" ha sido activado exitosamente`,
      });

      // Refresh the list
      await loadCoworks();
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

  const handleDeleteCowork = async (cowork: Cowork) => {
    const confirmed = await confirm({
      title: "Eliminar Cowork",
      description: `¿Estás seguro de que quieres eliminar "${cowork.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setActionLoading(cowork.id);
      console.log(`Deleting cowork: ${cowork.name}`);

      const response = await api.delete(`/api/super-admin/coworks/${cowork.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar cowork');
      }

      const result = await response.json();
      console.log('Cowork deleted:', result);

      toast({
        title: "Cowork eliminado",
        description: `"${cowork.name}" ha sido eliminado exitosamente`,
      });

      // Refresh the list
      await loadCoworks();
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
    });
  };

  if (loading && coworks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestión de Coworks</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Coworks</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} cowork{pagination.total !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadCoworks()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/super-admin/coworks/create">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Cowork
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, slug o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Estado
                    {statusFilter && <Badge variant="secondary" className="ml-2">{statusFilter}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("")}>
                    Todos los estados
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Activos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")}>
                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                    Suspendidos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("INACTIVE")}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Inactivos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coworks List */}
      <div className="space-y-4">
        {coworks.length > 0 ? (
          coworks.map((cowork) => (
            <Card key={cowork.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cowork.name}</h3>
                      <p className="text-sm text-gray-500">/{cowork.slug}</p>
                      {cowork.description && (
                        <p className="text-sm text-gray-600 mt-1 max-w-md truncate">
                          {cowork.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Creado: {formatDate(cowork.createdAt)}</span>
                        {cowork.domain && (
                          <span className="flex items-center gap-1">
                            🌐 {cowork.domain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(cowork.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(cowork.status)}
                        {cowork.status}
                      </span>
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={actionLoading === cowork.id}
                        >
                          {actionLoading === cowork.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/super-admin/coworks/${cowork.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/super-admin/coworks/${cowork.id}/users`}>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            Ver Usuarios
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <Link href={`/super-admin/coworks/${cowork.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        {cowork.status === 'ACTIVE' && (
                          <DropdownMenuItem 
                            onClick={() => handleSuspendCowork(cowork)}
                            className="text-yellow-600"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                        {cowork.status !== 'ACTIVE' && (
                          <DropdownMenuItem 
                            onClick={() => handleActivateCowork(cowork)}
                            className="text-green-600"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCowork(cowork)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron coworks
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter 
                  ? "Intenta ajustar los filtros de búsqueda" 
                  : "Comienza creando tu primer cowork"
                }
              </p>
              {!searchTerm && !statusFilter && (
                <Link href="/super-admin/coworks/create">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cowork
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} coworks
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1 || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}