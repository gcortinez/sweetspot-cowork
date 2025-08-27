"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
// Removed createInvitation import - using API instead
import InvitationsDashboard from './invitations-dashboard';
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
  UserX,
  RefreshCw,
  RotateCcw
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'END_USER' as User['role'],
    status: 'ACTIVE' as User['status']
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'SUPER_ADMIN' | 'COWORK_ADMIN' | 'COWORK_USER' | 'CLIENT_ADMIN' | 'END_USER'>('END_USER');
  const [inviteTenantId, setInviteTenantId] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isCleaningInvitations, setIsCleaningInvitations] = useState(false);
  const [isSyncingInvitations, setIsSyncingInvitations] = useState(false);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load users and tenants
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users, coworks, and invitations in parallel with error handling
      const [usersResponse, coworksResponse, invitationsResponse] = await Promise.all([
        fetch('/api/platform/users').catch(err => ({ ok: false, error: err.message })),
        fetch('/api/platform/coworks').catch(err => ({ ok: false, error: err.message })),
        fetch('/api/invitations').catch(err => ({ ok: false, error: err.message }))
      ]);
      
      // Parse responses with error handling
      const usersData = usersResponse.ok ? await usersResponse.json().catch(() => ({ success: false, error: 'Failed to parse users data' })) : { success: false, error: 'Failed to fetch users' };
      const coworksData = coworksResponse.ok ? await coworksResponse.json().catch(() => ({ success: false, error: 'Failed to parse coworks data' })) : { success: false, error: 'Failed to fetch coworks' };
      const invitationsData = invitationsResponse.ok ? await invitationsResponse.json().catch(() => ({ success: false, error: 'Failed to parse invitations data' })) : { success: false, error: 'Failed to fetch invitations' };
      
      if (usersData.success) {
        // Transform API response to match User interface
        const transformedUsers: User[] = usersData.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          tenantId: user.tenant?.id,
          tenantName: user.tenantName,
          isOnboarded: true, // Assuming all fetched users are onboarded
          lastLoginAt: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        
        setUsers(transformedUsers);
      } else {
        console.error('Failed to fetch users:', usersData.error);
      }
      
      if (coworksData.success) {
        // Set available coworks/tenants
        const formattedCoworks = coworksData.coworks.map((cowork: any) => ({
          id: cowork.id,
          name: cowork.name,
          slug: cowork.slug,
          status: cowork.status,
          userCount: cowork.userCount
        }));
        
        setAvailableTenants(formattedCoworks);
      } else {
        console.error('Failed to fetch coworks:', coworksData.error);
      }
      
      // Handle invitations data (non-blocking)
      if (invitationsData.success && invitationsData.invitations) {
        // Count only PENDING invitations (check both possible status formats)
        const pendingCount = invitationsData.invitations.filter(inv => 
          inv.status === 'PENDING' || inv.status === 'pending'
        ).length;
        
        setTotalInvitations(pendingCount);
      } else {
        console.warn('Could not load invitations (non-critical):', invitationsData.error);
        setTotalInvitations(0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      console.log(`🔄 Changing status of user ${userId} to ${newStatus}`);
      
      // Find the user to get required fields
      const user = users.find(u => u.id === userId);
      if (!user) {
        console.error('❌ User not found in local state');
        alert('Error: Usuario no encontrado');
        return;
      }
      
      // Call API to update user status with required fields
      const response = await fetch(`/api/platform/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: newStatus
        })
      });
      
      console.log(`📡 API Response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        alert(`Error al actualizar el estado: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`📊 API Response data:`, data);
      
      if (data.success) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: newStatus as any } : u
        ));
        
        console.log(`✅ User status updated successfully`);
      } else {
        console.error('❌ Failed to update user status:', data.error);
        alert(`Error al actualizar el estado: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      alert('Error al actualizar el estado del usuario');
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      setIsUpdatingUser(true);
      console.log(`🔄 Updating user ${editingUser.id} with data:`, editForm);
      
      const response = await fetch(`/api/platform/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      console.log(`📡 API Response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        alert(`Error al actualizar el usuario: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`📊 API Response data:`, data);
      
      if (data.success) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...u, ...editForm } : u
        ));
        
        setShowEditModal(false);
        setEditingUser(null);
        console.log('✅ User updated successfully');
      } else {
        console.error('❌ Failed to update user:', data.error);
        alert(`Error al actualizar el usuario: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert('Error al actualizar el usuario');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${user.firstName} ${user.lastName}?\n\nEsta acción no se puede deshacer y eliminará al usuario tanto de la base de datos como de Clerk.`)) {
      return;
    }

    try {
      setIsDeletingUser(true);
      
      const response = await fetch(`/api/platform/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the users list
        loadData();
        alert(data.message || 'Usuario eliminado exitosamente');
      } else {
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle cleanup duplicate invitations
  const handleCleanupInvitations = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar las invitaciones duplicadas?\n\nEsto eliminará invitaciones pendientes en Clerk para usuarios que ya existen en el sistema.')) {
      return;
    }

    try {
      setIsCleaningInvitations(true);
      
      const response = await fetch('/api/invitations/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Trigger refresh for invitations dashboard
        setRefreshTrigger(prev => prev + 1);
        // Reload data to update counters
        loadData();
        alert(`Limpieza completada. Se limpiaron ${data.cleanedCount} invitaciones duplicadas.`);
      } else {
        alert(data.error || 'Error al limpiar invitaciones');
      }
    } catch (error) {
      console.error('Error cleaning up invitations:', error);
      alert('Error al limpiar invitaciones duplicadas');
    } finally {
      setIsCleaningInvitations(false);
    }
  };

  // Handle sync invitations
  const handleSyncInvitations = async () => {
    if (!window.confirm('¿Estás seguro de que quieres sincronizar las invitaciones?\n\nEsto verificará el estado de las invitaciones en Clerk y actualizará la base de datos.')) {
      return;
    }

    try {
      setIsSyncingInvitations(true);
      
      const response = await fetch('/api/invitations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Trigger refresh for invitations dashboard
        setRefreshTrigger(prev => prev + 1);
        // Reload data to update counters
        loadData();
        alert(`Sincronización completada. Se sincronizaron ${data.syncedCount} invitaciones.`);
      } else {
        alert(data.error || 'Error al sincronizar invitaciones');
      }
    } catch (error) {
      console.error('Error syncing invitations:', error);
      alert('Error al sincronizar invitaciones');
    } finally {
      setIsSyncingInvitations(false);
    }
  };

  // Handle send invitation
  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setInviteMessage({ type: 'error', text: 'Por favor ingresa un email válido' });
      return;
    }

    if (inviteRole !== 'SUPER_ADMIN' && !inviteTenantId) {
      setInviteMessage({ type: 'error', text: 'Por favor selecciona un cowork para este rol' });
      return;
    }

    try {
      setIsSubmittingInvite(true);
      setInviteMessage(null);

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailAddress: inviteEmail.trim(),
          role: inviteRole,
          tenantId: inviteRole === 'SUPER_ADMIN' ? undefined : inviteTenantId || undefined
        })
      });
      
      const data = await response.json();

      if (data.success) {
        setInviteMessage({ 
          type: 'success', 
          text: `✅ Invitación enviada exitosamente a ${inviteEmail}` 
        });
        
        // Reset form
        setInviteEmail('');
        setInviteRole('END_USER');
        setInviteTenantId('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteMessage(null);
        }, 2000);
        
        // Refresh data and trigger dashboard refresh
        loadData();
        setRefreshTrigger(prev => prev + 1);
      } else {
        setInviteMessage({ type: 'error', text: `❌ ${data.error}` });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteMessage({ type: 'error', text: '❌ Error al enviar la invitación' });
    } finally {
      setIsSubmittingInvite(false);
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
            <button 
              onClick={handleSyncInvitations}
              disabled={isSyncingInvitations}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className={`h-4 w-4 ${isSyncingInvitations ? 'animate-spin' : ''}`} />
              <span>{isSyncingInvitations ? 'Sincronizando...' : 'Sincronizar Invitaciones'}</span>
            </button>
            <button 
              onClick={handleCleanupInvitations}
              disabled={isCleaningInvitations}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isCleaningInvitations ? 'animate-spin' : ''}`} />
              <span>{isCleaningInvitations ? 'Limpiando...' : 'Limpiar Invitaciones'}</span>
            </button>
            <button 
              onClick={() => {
                // Close any open action menu
                setActionMenuOpen(null);
                setMenuPosition(null);
                setShowInviteModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
            >
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

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 pt-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Usuarios Activos ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Invitaciones ({totalInvitations})</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden relative">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 200;
                          const viewportWidth = window.innerWidth;
                          
                          // Calculate horizontal position to keep menu on screen
                          let left = rect.right - menuWidth;
                          if (left < 10) {
                            left = rect.left;
                          }
                          
                          setMenuPosition({
                            top: rect.bottom + 5,
                            left: left
                          });
                          setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        id={`action-button-${user.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Menu Portal - Rendered directly to body to avoid any container clipping */}
        {mounted && actionMenuOpen && menuPosition && createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setActionMenuOpen(null);
                setMenuPosition(null);
              }}
            />
            <div 
              className="fixed w-48 bg-white rounded-md shadow-xl z-50 border border-gray-200"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    const user = filteredUsers.find(u => u.id === actionMenuOpen);
                    if (user) {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }
                    setActionMenuOpen(null);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver perfil
                </button>
                <button
                  onClick={() => {
                    const user = filteredUsers.find(u => u.id === actionMenuOpen);
                    if (user) {
                      handleEditUser(user);
                    }
                    setActionMenuOpen(null);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar usuario
                </button>
                
                {/* Status actions */}
                {(() => {
                  const user = filteredUsers.find(u => u.id === actionMenuOpen);
                  if (!user) return null;
                  
                  if (user.status === 'ACTIVE') {
                    return (
                      <button
                        onClick={() => {
                          handleStatusChange(user.id, 'SUSPENDED');
                          setActionMenuOpen(null);
                          setMenuPosition(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Suspender
                      </button>
                    );
                  }
                  
                  if (user.status === 'SUSPENDED') {
                    return (
                      <button
                        onClick={() => {
                          handleStatusChange(user.id, 'ACTIVE');
                          setActionMenuOpen(null);
                          setMenuPosition(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activar
                      </button>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Delete user action */}
                {(() => {
                  const user = filteredUsers.find(u => u.id === actionMenuOpen);
                  if (!user) return null;
                  
                  return (
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          handleDeleteUser(user);
                          setActionMenuOpen(null);
                          setMenuPosition(null);
                        }}
                        disabled={isDeletingUser}
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeletingUser ? 'Eliminando...' : 'Eliminar usuario'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>,
          document.body
        )}

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
        </>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <InvitationsDashboard key={refreshTrigger} />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invitar Usuario</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Success/Error Message */}
              {inviteMessage && (
                <div className={`p-3 rounded-md ${
                  inviteMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {inviteMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isSubmittingInvite}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  disabled={isSubmittingInvite}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="END_USER">Usuario Final</option>
                  <option value="COWORK_USER">Usuario de Cowork</option>
                  <option value="CLIENT_ADMIN">Admin de Cliente</option>
                  <option value="COWORK_ADMIN">Admin de Cowork</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              
              {inviteRole !== 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cowork <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={inviteTenantId} 
                    onChange={(e) => setInviteTenantId(e.target.value)}
                    disabled={isSubmittingInvite}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Seleccionar cowork...</option>
                    {availableTenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {inviteRole === 'SUPER_ADMIN' && (
                <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                  <p className="text-sm text-purple-800">
                    <strong>Super Admin:</strong> Este usuario tendrá acceso completo a toda la plataforma y podrá gestionar todos los coworks.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteMessage(null);
                  setInviteEmail('');
                  setInviteRole('END_USER');
                  setInviteTenantId('');
                }}
                disabled={isSubmittingInvite}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={isSubmittingInvite || !inviteEmail.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors flex items-center space-x-2"
              >
                {isSubmittingInvite && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmittingInvite ? 'Enviando...' : 'Enviar Invitación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Usuario</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.phone || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[selectedUser.role]}`}>
                    {ROLE_LABELS[selectedUser.role]}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.status}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cowork
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.tenantName || 'Plataforma'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Último acceso
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.lastLoginAt 
                      ? new Date(selectedUser.lastLoginAt).toLocaleDateString('es-ES')
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuario</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={isUpdatingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={isUpdatingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isUpdatingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isUpdatingUser}
                  placeholder="988773344"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                    disabled={isUpdatingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as User['status'] }))}
                    disabled={isUpdatingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                disabled={isUpdatingUser}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdatingUser || !editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors flex items-center space-x-2"
              >
                {isUpdatingUser && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isUpdatingUser ? 'Actualizando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;