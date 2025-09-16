'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PermissionGuard } from '@/components/guards/PermissionGuard'
import { CanAccess } from '@/components/guards/CanAccess'
import { Resource } from '@/lib/auth/permissions'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Calendar,
  Edit,
  Target,
  DollarSign,
  TrendingUp,
  History,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getClient } from '@/lib/actions/clients'
import {
  CLIENT_STATUS_METADATA,
  type ClientStatus,
  type ClientWithRelations
} from '@/lib/validations/clients'
import EditClientModal from '@/components/clients/EditClientModal'

interface ClientDetailPageContentProps {}

function ClientDetailPageContent({}: ClientDetailPageContentProps) {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<ClientWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    setIsLoading(true)
    try {
      const result = await getClient(clientId)

      if (result.success) {
        setClient(result.data)
      } else {
        console.error('Error loading client:', result.error)
        toast({
          title: "Error al cargar cliente",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
        router.push('/clients')
      }
    } catch (error) {
      console.error('Error loading client:', error)
      toast({
        title: "Error al cargar cliente",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
      router.push('/clients')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClient = (client: ClientWithRelations) => {
    setEditingClient(client)
  }

  const handleClientUpdated = () => {
    loadClient()
    setEditingClient(null)
  }

  const getStatusColor = (status: ClientStatus) => {
    const colors = {
      blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300',
      indigo: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300',
      green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300',
      yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300',
      red: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300',
    }
    return colors[CLIENT_STATUS_METADATA[status].color as keyof typeof colors] || colors.blue
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md"></div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cliente no encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            El cliente que buscas no existe o no tienes permisos para verlo.
          </p>
          <Button onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/clients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">{client.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(client.status)} border`}>
            {CLIENT_STATUS_METADATA[client.status].label}
          </Badge>
          <CanAccess permission={Resource.CLIENT_UPDATE}>
            <Button onClick={() => handleEditClient(client)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Button>
          </CanAccess>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-brand-purple" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.contactPerson && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contacto:</span>
                <span className="text-sm">{client.contactPerson}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <a
                href={`mailto:${client.email}`}
                className="text-sm text-brand-purple hover:underline"
              >
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Teléfono:</span>
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-brand-purple hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-sm font-medium">Dirección:</span>
                  <p className="text-sm text-gray-600">{client.address}</p>
                </div>
              </div>
            )}
            {client.taxId && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">NIT/RUT:</span>
                <span className="text-sm">{client.taxId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-purple" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-purple">
                {client._count?.opportunities || 0}
              </div>
              <div className="text-sm text-muted-foreground">Oportunidades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {client.opportunities?.filter(op => op.stage === 'CLOSED_WON').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Ganadas</div>
            </div>
            {client.opportunities && client.opportunities.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {formatCurrency(
                    client.opportunities
                      .filter(op => op.stage === 'CLOSED_WON')
                      .reduce((sum, op) => sum + op.value, 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-purple" />
              Fechas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Cliente desde:</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(client.createdAt)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Última actualización:</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(client.updatedAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-purple" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Opportunities */}
      {client.opportunities && client.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-purple" />
              Oportunidades Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.opportunities.slice(0, 5).map((opportunity) => (
                <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{opportunity.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(opportunity.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(opportunity.value)}</div>
                    <Badge variant="outline" className="text-xs">
                      {opportunity.stage}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  )
}

// Main page component with permission protection
export default function ClientDetailPage() {
  return (
    <PermissionGuard
      require={Resource.CLIENT_VIEW}
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-gray-600">
              No tienes permisos para ver los detalles del cliente.
            </p>
          </div>
        </div>
      }
    >
      <ClientDetailPageContent />
    </PermissionGuard>
  )
}