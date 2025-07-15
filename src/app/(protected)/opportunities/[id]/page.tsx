'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getOpportunity,
  changeOpportunityStage,
  deleteOpportunity
} from '@/lib/actions/opportunities'
import { listActivities } from '@/lib/actions/activities'
import { STAGE_METADATA } from '@/lib/validations/opportunities'
import { useToast } from '@/hooks/use-toast'
import EditOpportunityModal from '@/components/opportunities/EditOpportunityModal'
import {
  Target,
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Activity,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Opportunity {
  id: string
  title: string
  description?: string
  value: number
  probability: number
  expectedRevenue: number
  stage: keyof typeof STAGE_METADATA
  expectedCloseDate?: Date
  actualCloseDate?: Date
  lostReason?: string
  competitorInfo?: string
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface OpportunityActivity {
  id: string
  type: string
  title: string
  description?: string
  createdAt: Date
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function OpportunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const opportunityId = params.id as string
  
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [activities, setActivities] = useState<OpportunityActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const { toast } = useToast()

  // Load opportunity and activities
  useEffect(() => {
    loadOpportunityData()
  }, [opportunityId])

  const loadOpportunityData = async () => {
    setLoading(true)
    try {
      const [opportunityResult, activitiesResult] = await Promise.all([
        getOpportunity(opportunityId),
        listActivities({ opportunityId })
      ])

      if (opportunityResult.success) {
        setOpportunity(opportunityResult.data)
      } else {
        toast({
          title: "Error",
          description: opportunityResult.error,
          variant: "destructive",
        })
        router.push('/opportunities')
        return
      }

      if (activitiesResult.success) {
        setActivities(activitiesResult.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar la oportunidad",
        variant: "destructive",
      })
      router.push('/opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (newStage: keyof typeof STAGE_METADATA) => {
    if (!opportunity) return
    
    try {
      const result = await changeOpportunityStage(opportunity.id, { stage: newStage })
      
      if (result.success) {
        toast({
          title: "Etapa actualizada",
          description: `Oportunidad movida a ${STAGE_METADATA[newStage].label}`,
        })
        loadOpportunityData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar la etapa",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOpportunity = async () => {
    if (!opportunity) return
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la oportunidad "${opportunity.title}"?`)) {
      return
    }

    try {
      const result = await deleteOpportunity(opportunity.id)
      
      if (result.success) {
        toast({
          title: "Oportunidad eliminada",
          description: `"${opportunity.title}" ha sido eliminada exitosamente.`,
        })
        router.push('/opportunities')
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la oportunidad",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStageColor = (stage: keyof typeof STAGE_METADATA) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[STAGE_METADATA[stage].color as keyof typeof colors] || colors.gray
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'MEETING': return <MessageSquare className="h-4 w-4" />
      case 'NOTE': return <FileText className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          currentPage="Oportunidades"
          showBreadcrumb={true}
          breadcrumbItems={[
            { label: 'Oportunidades', href: '/opportunities' },
            { label: 'Cargando...' }
          ]}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando oportunidad...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          currentPage="Oportunidades"
          showBreadcrumb={true}
          breadcrumbItems={[
            { label: 'Oportunidades', href: '/opportunities' },
            { label: 'No encontrada' }
          ]}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Oportunidad no encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              La oportunidad que buscas no existe o no tienes permisos para verla.
            </p>
            <Button onClick={() => router.push('/opportunities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Oportunidades
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentPage="Oportunidades"
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'Oportunidades', href: '/opportunities' },
          { label: opportunity.title }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/opportunities')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{opportunity.title}</h1>
              <p className="text-gray-600">
                Creada el {new Date(opportunity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStageColor(opportunity.stage)}>
              {STAGE_METADATA[opportunity.stage].label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDeleteOpportunity}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Resumen de la Oportunidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-gray-600">{opportunity.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Valor</h4>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(opportunity.value)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Probabilidad</h4>
                    <p className="text-lg font-bold text-blue-600">
                      {opportunity.probability}%
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Revenue Esperado</h4>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(opportunity.expectedRevenue)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Etapa</h4>
                    <Badge className={getStageColor(opportunity.stage)}>
                      {STAGE_METADATA[opportunity.stage].label}
                    </Badge>
                  </div>
                </div>

                {opportunity.expectedCloseDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Fecha de Cierre Esperada</h4>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {opportunity.actualCloseDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Fecha de Cierre Real</h4>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(opportunity.actualCloseDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {opportunity.lostReason && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Razón de Pérdida</h4>
                    <p className="text-red-600">{opportunity.lostReason}</p>
                  </div>
                )}

                {opportunity.competitorInfo && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Información de Competidores</h4>
                    <p className="text-gray-600">{opportunity.competitorInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activities Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Actividades Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          {activity.description && (
                            <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {activity.user.firstName} {activity.user.lastName}
                            <span className="mx-2">•</span>
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay actividades registradas para esta oportunidad.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Oportunidad
                </Button>
                
                {/* Stage progression buttons */}
                {opportunity.stage !== 'CLOSED_WON' && opportunity.stage !== 'CLOSED_LOST' && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Avanzar Etapa</h4>
                    {Object.entries(STAGE_METADATA).map(([stage, metadata]) => {
                      if (stage === opportunity.stage) return null
                      if (stage === 'ON_HOLD') return null
                      
                      return (
                        <Button
                          key={stage}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleStageChange(stage as keyof typeof STAGE_METADATA)}
                        >
                          <ArrowLeft className="h-3 w-3 mr-2 rotate-180" />
                          {metadata.label}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {(opportunity.client || opportunity.lead || opportunity.assignedTo) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Contactos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {opportunity.client && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Cliente
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{opportunity.client.name}</p>
                        <p className="text-sm text-gray-600">{opportunity.client.email}</p>
                        {opportunity.client.phone && (
                          <p className="text-sm text-gray-600">{opportunity.client.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {opportunity.lead && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Prospecto Original
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">
                          {opportunity.lead.firstName} {opportunity.lead.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{opportunity.lead.email}</p>
                        {opportunity.lead.phone && (
                          <p className="text-sm text-gray-600">{opportunity.lead.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {opportunity.assignedTo && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Asignado a
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">
                          {opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{opportunity.assignedTo.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Oportunidad creada</p>
                      <p className="text-gray-600">
                        {new Date(opportunity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {opportunity.updatedAt !== opportunity.createdAt && (
                    <div className="flex items-center text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">Última actualización</p>
                        <p className="text-gray-600">
                          {new Date(opportunity.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {opportunity.actualCloseDate && (
                    <div className="flex items-center text-sm">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-3 ${
                        opportunity.stage === 'CLOSED_WON' ? 'bg-green-600' : 'bg-red-600'
                      }`}></div>
                      <div>
                        <p className="font-medium">
                          {opportunity.stage === 'CLOSED_WON' ? 'Cerrada ganada' : 'Cerrada perdida'}
                        </p>
                        <p className="text-gray-600">
                          {new Date(opportunity.actualCloseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Opportunity Modal */}
      {isEditModalOpen && (
        <EditOpportunityModal
          opportunity={opportunity}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onOpportunityUpdated={loadOpportunityData}
        />
      )}
    </div>
  )
}