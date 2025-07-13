"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  UserCheck,
  UserX
} from 'lucide-react';

interface User {
  id: string;
  clerkId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'COWORK_USER' | 'CLIENT_ADMIN' | 'END_USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenantId?: string;
  tenantName?: string;
  isOnboarded: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COWORK_ADMIN: 'Admin de Cowork',
  COWORK_USER: 'Usuario de Cowork',
  CLIENT_ADMIN: 'Admin de Cliente',
  END_USER: 'Usuario Final'
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  COWORK_ADMIN: 'bg-blue-100 text-blue-800',
  COWORK_USER: 'bg-green-100 text-green-800',
  CLIENT_ADMIN: 'bg-orange-100 text-orange-800',
  END_USER: 'bg-gray-100 text-gray-800'
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);

  // Load users and tenants
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, these would be separate API calls
      // For now, using mock data
      const mockUsers: User[] = [
        {
          id: '1',
          clerkId: 'clerk_123',
          email: 'admin@sweetspot.com',
          firstName: 'Carlos',
          lastName: 'Administrador',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isOnboarded: true,
          lastLoginAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          clerkId: 'clerk_456',
          email: 'maria@techhub.com',
          firstName: 'María',
          lastName: 'González',
          phone: '+34 612 345 678',
          role: 'COWORK_ADMIN',
          status: 'ACTIVE',
          tenantId: 'tenant_1',
          tenantName: 'Tech Hub Madrid',
          isOnboarded: true,
          lastLoginAt: '2024-01-14T16:45:00Z',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-14T16:45:00Z'
        },
        {
          id: '3',
          clerkId: 'clerk_789',
          email: 'juan@freelancer.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '+34 698 765 432',
          role: 'END_USER',
          status: 'ACTIVE',
          tenantId: 'tenant_1',
          tenantName: 'Tech Hub Madrid',
          isOnboarded: true,
          lastLoginAt: '2024-01-15T09:15:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-15T09:15:00Z'
        }
      ];

      const mockTenants = [
        { id: 'tenant_1', name: 'Tech Hub Madrid' },
        { id: 'tenant_2', name: 'Innovation Center' },
        { id: 'tenant_3', name: 'Startup Valley' }
      ];

      setUsers(mockUsers);
      setAvailableTenants(mockTenants);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesTenant = tenantFilter === 'all' || 
                         (tenantFilter === 'super_admin' && !user.tenantId) ||
                         user.tenantId === tenantFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesTenant;
  });

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      console.log(`Changing role of user ${userId} to ${newRole}`);
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole as any } : u
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      console.log(`Changing status of user ${userId} to ${newStatus}`);
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus as any } : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'SUSPENDED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="h-4 w-4" />;
      case 'COWORK_ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'COWORK_USER':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              Gestión de Usuarios
            </h2>
            <p className="text-gray-600">Administra todos los usuarios de la plataforma</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors">
              <Users className="h-4 w-4" />
              <span>Invitar Usuario</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los roles</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
          
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los coworks</option>
            <option value="super_admin">Super Admins</option>
            {availableTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cowork
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.tenantName ? (
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{user.tenantName}</span>
                        </div>
                      ) : (
                        <span className="text-purple-600 font-medium flex items-center space-x-1">
                          <Crown className="h-3 w-3" />
                          <span>Plataforma</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user.status)}
                      <span className="text-sm text-gray-900">
                        {user.status === 'ACTIVE' ? 'Activo' : 
                         user.status === 'INACTIVE' ? 'Inactivo' : 'Suspendido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(user.lastLoginAt).toLocaleDateString('es-ES')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {actionMenuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-8 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver perfil
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar usuario
                              </button>
                              
                              {/* Status actions */}
                              {user.status === 'ACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(user.id, 'SUSPENDED');
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspender
                                </button>
                              )}
                              
                              {user.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(user.id, 'ACTIVE');
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activar
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || tenantFilter !== 'all' 
                ? 'No se encontraron usuarios' 
                : 'No hay usuarios'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || tenantFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Los usuarios aparecerán aquí cuando se registren'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-blue-800">
              <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios mostrados
            </span>
            <span className="text-blue-600">
              {users.filter(u => u.status === 'ACTIVE').length} activos
            </span>
            <span className="text-blue-600">
              {users.filter(u => u.role === 'SUPER_ADMIN').length} super admins
            </span>
          </div>
          <button
            onClick={loadData}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Actualizar lista
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;