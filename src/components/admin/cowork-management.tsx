"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  Pause,
  AlertTriangle,
  X,
  Calendar,
  Package,
  TrendingUp
} from 'lucide-react';
import { useCoworkSelection } from '@/contexts/cowork-selection-context';
import { useRouter } from 'next/navigation';

interface Cowork {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  stats: {
    users: number;
    clients: number;
    spaces: number;
    bookings: number;
  };
  settings?: {
    address?: any;
    contactInfo?: any;
  };
}

export function CoworkManagement() {
  const { refreshCoworks } = useCoworkSelection();
  const router = useRouter();
  const [coworks, setCoworks] = useState<Cowork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCowork, setSelectedCowork] = useState<Cowork | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Load coworks
  const loadCoworks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coworks');
      const data = await response.json();
      
      if (data.success && data.data.allCoworks) {
        setCoworks(data.data.allCoworks);
      }
    } catch (error) {
      console.error('Error loading coworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoworks();
  }, []);

  // Filter coworks based on search and status
  const filteredCoworks = coworks.filter(cowork => {
    const matchesSearch = cowork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cowork.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cowork.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle status change
  const handleStatusChange = async (coworkId: string, newStatus: string) => {
    try {
      // In a real implementation, this would call your API
      console.log(`Changing status of ${coworkId} to ${newStatus}`);
      
      // Update local state
      setCoworks(prev => prev.map(c => 
        c.id === coworkId ? { ...c, status: newStatus as any } : c
      ));
      
      // Refresh the cowork selection context
      await refreshCoworks();
    } catch (error) {
      console.error('Error updating cowork status:', error);
    }
  };

  // Handle delete
  const handleDelete = async (coworkId: string) => {
    try {
      // In a real implementation, this would call your API
      console.log(`Deleting cowork ${coworkId}`);
      
      // Update local state
      setCoworks(prev => prev.filter(c => c.id !== coworkId));
      setShowDeleteConfirm(null);
      
      // Refresh the cowork selection context
      await refreshCoworks();
    } catch (error) {
      console.error('Error deleting cowork:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'SUSPENDED':
        return <Pause className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      case 'SUSPENDED':
        return 'Suspendido';
      default:
        return 'Desconocido';
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
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Coworks</h2>
            <p className="text-gray-600">Administra todos los espacios de coworking de la plataforma</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cowork</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar coworks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
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
        </div>
      </div>

      {/* Coworks Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cowork
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoworks.map((cowork) => (
                <tr key={cowork.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {cowork.logo ? (
                          <img className="h-10 w-10 rounded-lg object-cover" src={cowork.logo} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{cowork.name}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{cowork.slug}</span>
                          {cowork.domain && (
                            <>
                              <span>•</span>
                              <Globe className="h-3 w-3" />
                              <span>{cowork.domain}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(cowork.status)}
                      <span className="text-sm text-gray-900">{getStatusText(cowork.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-gray-400" />
                          {cowork.stats.users}
                        </span>
                        <span className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                          {cowork.stats.spaces}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cowork.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === cowork.id ? null : cowork.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {actionMenuOpen === cowork.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-8 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedCowork(cowork);
                                  setShowDetailModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCowork(cowork);
                                  setShowEditModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </button>
                              
                              {/* Status change options */}
                              {cowork.status === 'ACTIVE' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(cowork.id, 'SUSPENDED');
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center"
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspender
                                </button>
                              )}
                              
                              {cowork.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(cowork.id, 'ACTIVE');
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activar
                                </button>
                              )}
                              
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(cowork.id);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </button>
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
        {filteredCoworks.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron coworks' : 'No hay coworks'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer espacio de coworking'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Crear primer cowork
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este cowork? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCowork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Detalles del Cowork</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCowork(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="mt-1 text-gray-900">{selectedCowork.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Slug</label>
                  <p className="mt-1 text-gray-900">{selectedCowork.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1 flex items-center space-x-2">
                    {getStatusIcon(selectedCowork.status)}
                    <span>{getStatusText(selectedCowork.status)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dominio</label>
                  <p className="mt-1 text-gray-900">{selectedCowork.domain || 'No configurado'}</p>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Estadísticas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Usuarios</span>
                    </div>
                    <p className="mt-1 text-xl font-semibold">{selectedCowork.stats.users}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Espacios</span>
                    </div>
                    <p className="mt-1 text-xl font-semibold">{selectedCowork.stats.spaces}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Clientes</span>
                    </div>
                    <p className="mt-1 text-xl font-semibold">{selectedCowork.stats.clients}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Reservas</span>
                    </div>
                    <p className="mt-1 text-xl font-semibold">{selectedCowork.stats.bookings}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Creado</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedCowork.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Última actualización</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedCowork.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    // Navigate to cowork dashboard
                    router.push(`/cowork/${selectedCowork.slug}/dashboard`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ver Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCowork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Editar Cowork</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCowork(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  defaultValue={selectedCowork.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  defaultValue={selectedCowork.slug}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dominio
                </label>
                <input
                  type="text"
                  defaultValue={selectedCowork.domain || ''}
                  placeholder="ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  defaultValue={selectedCowork.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="SUSPENDED">Suspendido</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCowork(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement save functionality
                    console.log('Saving cowork changes...');
                    setShowEditModal(false);
                    setSelectedCowork(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-blue-800">
              <strong>{filteredCoworks.length}</strong> de <strong>{coworks.length}</strong> coworks mostrados
            </span>
            <span className="text-blue-600">
              {coworks.filter(c => c.status === 'ACTIVE').length} activos
            </span>
          </div>
          <button
            onClick={loadCoworks}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Actualizar lista
          </button>
        </div>
      </div>
    </div>
  );
}

export { CoworkManagement };
export default CoworkManagement;