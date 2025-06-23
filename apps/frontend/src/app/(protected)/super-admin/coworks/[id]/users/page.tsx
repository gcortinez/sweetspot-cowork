"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Users,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Edit,
  Shield,
  Ban,
  Mail,
  Phone,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'CLIENT_ADMIN' | 'END_USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt: string;
  phone?: string;
  client?: {
    id: string;
    name: string;
  };
}

interface CoworkInfo {
  id: string;
  name: string;
  slug: string;
}

export default function CoworkUsersPage() {
  const params = useParams();
  const router = useRouter();
  const [cowork, setCowork] = useState<CoworkInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const { toast } = useToast();
  const api = useApi();
  const confirm = useConfirm();

  useEffect(() => {
    if (params.id) {
      loadUsers();
    }
  }, [params.id, pagination.page, roleFilter, statusFilter]);

  const loadUsers = async (search?: string) => {
    try {
      setLoading(true);
      console.log('Loading users for cowork:', params.id);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (roleFilter) queryParams.append('role', roleFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search || searchTerm) queryParams.append('search', search || searchTerm);

      const response = await api.get(`/api/super-admin/coworks/${params.id}/users?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar usuarios');
      }

      const data = await response.json();
      console.log('Users loaded:', data);

      if (data.success && data.data) {
        setCowork(data.data.cowork);
        setUsers(data.data.users || []);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error al cargar usuarios",
        description: error instanceof Error ? error.message : "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    await loadUsers(searchTerm);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'COWORK_ADMIN': return 'Admin Cowork';
      case 'CLIENT_ADMIN': return 'Admin Cliente';
      case 'END_USER': return 'Usuario Final';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800';
      case 'COWORK_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'CLIENT_ADMIN': return 'bg-blue-100 text-blue-800';
      case 'END_USER': return 'bg-gray-100 text-gray-800';
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

  if (loading && users.length === 0) {
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
        <div className="flex items-center gap-4">
          <Link href={`/super-admin/coworks/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Detalles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Usuarios de {cowork?.name || 'Cowork'}
            </h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} usuario{pagination.total !== 1 ? 's' : ''} registrado{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadUsers()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Usuario
          </Button>
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
                  placeholder="Buscar por nombre o email..."
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
                    <Shield className="h-4 w-4 mr-2" />
                    Rol
                    {roleFilter && <Badge variant="secondary" className="ml-2">{getRoleLabel(roleFilter)}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setRoleFilter("")}>
                    Todos los roles
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRoleFilter("COWORK_ADMIN")}>
                    Admin Cowork
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("CLIENT_ADMIN")}>
                    Admin Cliente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("END_USER")}>
                    Usuario Final
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Users List */}
      <div className="space-y-4">
        {users.length > 0 ? (
          users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                        {user.client && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {user.client.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Creado: {formatDate(user.createdAt)}
                        </span>
                        {user.lastLoginAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Último acceso: {formatDate(user.lastLoginAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge className={getStatusColor(user.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(user.status)}
                        {user.status}
                      </span>
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Usuario
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Cambiar Rol
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === 'ACTIVE' && (
                          <DropdownMenuItem className="text-yellow-600">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                        {user.status !== 'ACTIVE' && (
                          <DropdownMenuItem className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activar
                          </DropdownMenuItem>
                        )}
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
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter || statusFilter
                  ? "Intenta ajustar los filtros de búsqueda" 
                  : "No hay usuarios registrados en este cowork"
                }
              </p>
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
            {pagination.total} usuarios
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