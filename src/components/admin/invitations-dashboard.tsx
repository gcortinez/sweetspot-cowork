"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Trash2,
  Users,
  Building2,
  Crown,
  Shield,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { InvitationData } from '@/lib/actions/invitations';

interface InvitationsDashboardProps {
  className?: string;
}

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COWORK_ADMIN: 'Admin de Cowork',
  COWORK_USER: 'Usuario de Cowork'
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  COWORK_ADMIN: 'bg-blue-100 text-blue-800',
  COWORK_USER: 'bg-green-100 text-green-800'
};

const ROLE_ICONS = {
  SUPER_ADMIN: Crown,
  COWORK_ADMIN: Shield,
  COWORK_USER: Building2
};

export function InvitationsDashboard({ className = "" }: InvitationsDashboardProps) {
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'all'>('pending');
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());

  // Load invitations
  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/invitations');
      const data = await response.json();
      
      if (data.success) {
        setInvitations(data.invitations);
      } else {
        console.error('Failed to load invitations:', data.error);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  // Filter invitations based on active tab
  const filteredInvitations = invitations.filter(inv => {
    if (activeTab === 'all') return true;
    return inv.status === activeTab;
  });

  // Handle resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    if (processingInvitations.has(invitationId)) return;

    try {
      setProcessingInvitations(prev => new Set(prev).add(invitationId));
      
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        alert('✅ Invitación reenviada exitosamente');
        
        // Refresh invitations list
        await loadInvitations();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('❌ Error al reenviar la invitación');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  // Handle revoke invitation
  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    if (processingInvitations.has(invitationId)) return;

    if (!confirm(`¿Estás seguro de que quieres revocar la invitación para ${email}?`)) {
      return;
    }

    try {
      setProcessingInvitations(prev => new Set(prev).add(invitationId));
      
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        alert('✅ Invitación revocada exitosamente');
        
        // Refresh invitations list
        await loadInvitations();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      alert('❌ Error al revocar la invitación');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role icon
  const getRoleIcon = (role: keyof typeof ROLE_ICONS) => {
    const IconComponent = ROLE_ICONS[role] || User;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const revokedCount = invitations.filter(inv => inv.status === 'revoked').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              Gestión de Invitaciones
            </h2>
            <p className="text-gray-600">Administra las invitaciones enviadas a nuevos usuarios</p>
          </div>
          <button
            onClick={loadInvitations}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
              </div>
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aceptadas</p>
                <p className="text-2xl font-bold text-green-900">{acceptedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Revocadas</p>
                <p className="text-2xl font-bold text-red-900">{revokedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accepted'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Aceptadas ({acceptedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Todas ({invitations.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? 'No hay invitaciones pendientes' : 
               activeTab === 'accepted' ? 'No hay invitaciones aceptadas' : 
               'No hay invitaciones'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'pending' ? 'Las nuevas invitaciones aparecerán aquí' : 
               'Las invitaciones aparecerán aquí cuando se envíen'}
            </p>
          </div>
        ) : (
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
                    Enviada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.emailAddress}
                          </div>
                          <div className="text-sm text-gray-500">
                            Invitado por {invitation.invitedBy}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(invitation.role as keyof typeof ROLE_ICONS)}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[invitation.role as keyof typeof ROLE_COLORS]}`}>
                          {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invitation.tenantName ? (
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{invitation.tenantName}</span>
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
                        {getStatusIcon(invitation.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invitation.status)}`}>
                          {invitation.status === 'pending' ? 'Pendiente' :
                           invitation.status === 'accepted' ? 'Aceptada' :
                           invitation.status === 'revoked' ? 'Revocada' : invitation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(invitation.createdAt).toLocaleDateString('es-ES')}</span>
                      </div>
                      {invitation.acceptedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          Aceptada: {new Date(invitation.acceptedAt).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {invitation.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            disabled={processingInvitations.has(invitation.id)}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-1"
                            title="Reenviar invitación"
                          >
                            <RotateCcw className={`h-4 w-4 ${processingInvitations.has(invitation.id) ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id, invitation.emailAddress)}
                            disabled={processingInvitations.has(invitation.id)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                            title="Revocar invitación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {invitation.status === 'accepted' && (
                        <span className="text-green-600 text-xs">✓ Completada</span>
                      )}
                      {invitation.status === 'revoked' && (
                        <span className="text-red-600 text-xs">✗ Revocada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvitationsDashboard;