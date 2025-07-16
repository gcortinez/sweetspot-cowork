'use client'

import React, { useState, useEffect } from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2,
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  DollarSign,
  Target,
  Phone,
  Mail,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  UserX,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  listClients,
  getClientStats,
  deleteClient,
  type ListClientsInput
} from '@/lib/actions/clients'
import { 
  CLIENT_STATUS,
  CLIENT_STATUS_METADATA,
  type ClientStatus,
  type ClientWithRelations
} from '@/lib/validations/clients'
import ClientsTable from '@/components/clients/ClientsTable'
import CreateClientModal from '@/components/clients/CreateClientModal'
import EditClientModal from '@/components/clients/EditClientModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ClientStats {
  overall: {
    totalClients: number;
    activeClients: number;
    prospects: number;
    conversionRate: number;
  };
  byStatus: Record<string, number>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const { toast } = useToast()

  // Load clients and stats
  useEffect(() => {
    loadClients()
    loadStats()
  }, [currentPage, searchQuery, statusFilter])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const filters: ListClientsInput = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      }

      const result = await listClients(filters)
      
      if (result.success) {
        setClients(result.data)
        setTotalPages(result.pagination.totalPages)
      } else {
        console.error('Error loading clients:', result.error)
        toast({
          title: "Error al cargar clientes",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error al cargar clientes",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    setIsStatsLoading(true)
    try {
      const result = await getClientStats()
      
      if (result.success) {
        setStats(result.data)
      } else {
        console.error('Error loading stats:', result.error)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: ClientStatus | 'all') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleEditClient = (client: ClientWithRelations) => {
    setEditingClient(client)
  }

  const handleDeleteClient = (clientId: string) => {
    setDeletingClientId(clientId)
  }

  const handleViewClient = (clientId: string) => {
    // Navigate to client detail page
    window.location.href = `/clients/${clientId}`
  }

  const confirmDeleteClient = async () => {
    if (!deletingClientId) return

    try {
      const result = await deleteClient(deletingClientId)
      
      if (result.success) {
        toast({
          title: "Cliente eliminado",
          description: result.message || "El cliente ha sido marcado como inactivo",
        })
        loadClients()
        loadStats()
      } else {
        toast({
          title: "Error al eliminar cliente",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error al eliminar cliente",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setDeletingClientId(null)
    }
  }

  const handleClientCreated = () => {
    loadClients()
    loadStats()
  }

  const handleClientUpdated = () => {
    loadClients()
    loadStats()
    setEditingClient(null)
  }

  const getStatusIcon = (status: ClientStatus) => {
    const icons = {
      LEAD: UserPlus,
      PROSPECT: Users,
      ACTIVE: UserCheck,
      INACTIVE: UserX,
      CHURNED: AlertCircle,
    }
    return icons[status] || Users
  }

  const getStatusColor = (status: ClientStatus) => {
    const colors = {
      LEAD: 'from-blue-500 to-indigo-600',
      PROSPECT: 'from-indigo-500 to-purple-600',
      ACTIVE: 'from-green-500 to-emerald-600',
      INACTIVE: 'from-yellow-500 to-orange-600',
      CHURNED: 'from-red-500 to-pink-600',
    }
    return colors[status] || 'from-gray-500 to-slate-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentPage="Clientes"
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'Clientes' }
        ]}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                <p className="text-gray-600">Administra y da seguimiento a tus clientes y prospectos</p>
              </div>
            </div>
            <CreateClientModal onClientCreated={handleClientCreated} />
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Clientes
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {isStatsLoading ? (
                <div className="h-6 w-16 bg-blue-200 animate-pulse rounded"></div>
              ) : (
                stats?.overall.totalClients || 0
              )}
            </div>
            <p className="text-xs text-blue-600">
              Todos los clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Clientes Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {isStatsLoading ? (
                <div className="h-6 w-16 bg-green-200 animate-pulse rounded"></div>
              ) : (
                stats?.overall.activeClients || 0
              )}
            </div>
            <p className="text-xs text-green-600">
              Con servicios contratados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Prospectos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {isStatsLoading ? (
                <div className="h-6 w-16 bg-purple-200 animate-pulse rounded"></div>
              ) : (
                stats?.overall.prospects || 0
              )}
            </div>
            <p className="text-xs text-purple-600">
              Leads y prospectos calificados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Conversión
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {isStatsLoading ? (
                <div className="h-6 w-16 bg-amber-200 animate-pulse rounded"></div>
              ) : (
                `${(stats?.overall.conversionRate || 0).toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-amber-600">
              Tasa de conversión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-brand-purple" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(CLIENT_STATUS_METADATA).map(([status, metadata]) => {
                const count = stats.byStatus[status] || 0
                const StatusIcon = getStatusIcon(status as ClientStatus)
                
                return (
                  <div key={status} className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${getStatusColor(status as ClientStatus)} flex items-center justify-center mb-2`}>
                      <StatusIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{metadata.label}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Lista de Clientes</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadClients()
                  loadStats()
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClientsTable
            clients={clients}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onViewClient={handleViewClient}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onClientUpdated={handleClientUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingClientId} onOpenChange={() => setDeletingClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el cliente como inactivo. No podrás revertir esta acción.
              El cliente no se eliminará completamente, pero se marcará como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient}>
              Marcar como inactivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </div>
  )
}