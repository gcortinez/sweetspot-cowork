"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  Target, 
  TrendingUp, 
  Clock,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Percent,
  Activity,
  FileText,
  Plus,
  Loader2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { STAGE_METADATA } from '@/lib/validations/opportunities';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { listQuotationsAction, changeQuotationStatusAction, duplicateQuotationAction, deleteQuotationAction } from '@/lib/actions/quotations';
import QuotationsList from '@/components/quotations/QuotationsList';
import CreateQuotationModal from '@/components/quotations/CreateQuotationModal';
import QuotationDetailModal from '@/components/quotations/QuotationDetailModal';
import EditQuotationModal from '@/components/quotations/EditQuotationModal';
import QuotationVersionsModal from '@/components/quotations/QuotationVersionsModal';
import SendQuotationModal from '@/components/quotations/SendQuotationModal';
import { listActivities, updateActivity } from '@/lib/actions/activities';
import CreateActivityModal from '@/components/activities/CreateActivityModal';
import ActivityDetailModal from '@/components/activities/ActivityDetailModal';
import DraggableActivitiesList from '@/components/activities/DraggableActivitiesList';
import DocumentUpload from '@/components/opportunities/DocumentUpload';
import DocumentList from '@/components/opportunities/DocumentList';

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
  createdAt: Date
  competitorInfo?: string
  lostReason?: string
  client?: {
    id: string
    name: string
    email: string
    phone?: string
    contactPerson?: string
    status: string
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
  _count?: {
    quotations: number
    activities: number
  }
}

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (opportunity: Opportunity) => void;
  onCreateActivity?: (opportunityId: string) => void;
}

interface Quotation {
  id: string
  number: string
  title: string
  description?: string
  subtotal: number
  discounts: number
  taxes: number
  total: number
  currency: string
  validUntil: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
  notes?: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    email: string
    company?: string
  }
  opportunity?: {
    id: string
    title: string
    stage: string
    value: number
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
    company?: string
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

export default function OpportunityDetailModal({ 
  opportunity, 
  isOpen, 
  onClose,
  onEdit,
  onCreateActivity
}: OpportunityDetailModalProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [versionsQuotation, setVersionsQuotation] = useState<Quotation | null>(null)
  const [sendingQuotation, setSendingQuotation] = useState<Quotation | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [changingQuotationStatus, setChangingQuotationStatus] = useState<string | null>(null)
  const [localOpportunity, setLocalOpportunity] = useState<Opportunity | null>(opportunity)
  const [documentsRefreshTrigger, setDocumentsRefreshTrigger] = useState<number>(0)
  const { toast } = useToast()

  // Update local opportunity when prop changes
  React.useEffect(() => {
    setLocalOpportunity(opportunity)
  }, [opportunity])

  // Helper function to update counts
  const updateOpportunityCounts = (quotationsCount?: number, activitiesCount?: number) => {
    if (!localOpportunity) return
    
    setLocalOpportunity(prev => ({
      ...prev!,
      _count: {
        quotations: quotationsCount !== undefined ? quotationsCount : prev!._count?.quotations || 0,
        activities: activitiesCount !== undefined ? activitiesCount : prev!._count?.activities || 0,
      }
    }))
  }

  // Load quotations for this opportunity
  const loadQuotations = async () => {
    if (!opportunity) return
    
    setIsLoadingQuotations(true)
    try {
      const result = await listQuotationsAction({
        opportunityId: opportunity.id
      })
      
      if (result.success) {
        const newQuotations = result.data?.quotations || []
        setQuotations(newQuotations)
        updateOpportunityCounts(newQuotations.length, undefined)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar las cotizaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading quotations:', error)
      toast({
        title: "Error",
        description: "Error al cargar las cotizaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoadingQuotations(false)
    }
  }

  // Load activities for this opportunity
  const loadActivities = async () => {
    if (!opportunity) return
    
    setIsLoadingActivities(true)
    try {
      const result = await listActivities({
        opportunityId: opportunity.id,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      })
      
      if (result.success) {
        const newActivities = result.data || []
        setActivities(newActivities)
        updateOpportunityCounts(undefined, newActivities.length)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar las actividades",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading activities:', error)
      toast({
        title: "Error",
        description: "Error al cargar las actividades",
        variant: "destructive",
      })
    } finally {
      setIsLoadingActivities(false)
    }
  }

  // Load data when modal opens
  React.useEffect(() => {
    if (isOpen && opportunity) {
      loadQuotations()
      loadActivities()
    }
  }, [isOpen, opportunity])

  // Handle quotation actions
  const handleQuotationCreated = () => {
    setShowCreateQuotationModal(false)
    loadQuotations()
  }

  const handleQuotationStatusChange = async (quotationId: string, newStatus: string) => {
    setChangingQuotationStatus(quotationId)
    try {
      const result = await changeQuotationStatusAction({
        id: quotationId,
        status: newStatus
      })
      
      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: "El estado de la cotización ha sido actualizado",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error changing quotation status:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setChangingQuotationStatus(null)
    }
  }

  const handleQuotationDuplicate = async (quotation: Quotation) => {
    try {
      const result = await duplicateQuotationAction({
        id: quotation.id
      })
      
      if (result.success) {
        toast({
          title: "Cotización duplicada",
          description: "Se ha creado una nueva versión de la cotización",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al duplicar la cotización",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error duplicating quotation:', error)
      toast({
        title: "Error",
        description: "Error al duplicar la cotización",
        variant: "destructive",
      })
    }
  }

  const handleQuotationDelete = async (quotationId: string) => {
    try {
      const result = await deleteQuotationAction({
        id: quotationId
      })
      
      if (result.success) {
        toast({
          title: "Cotización eliminada",
          description: "La cotización ha sido eliminada exitosamente",
          duration: 3000,
        })
        loadQuotations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar la cotización",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting quotation:', error)
      toast({
        title: "Error",
        description: "Error al eliminar la cotización",
        variant: "destructive",
      })
    }
  }

  const handleQuotationView = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
  }

  const handleQuotationEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation)
  }

  const handleQuotationUpdated = () => {
    setEditingQuotation(null)
    loadQuotations()
  }

  const handleViewVersions = (quotation: Quotation) => {
    setVersionsQuotation(quotation)
    setSelectedQuotation(null) // Close detail modal
  }

  const handleVersionAction = (action: string, quotation: Quotation) => {
    switch (action) {
      case 'view':
        setSelectedQuotation(quotation)
        setVersionsQuotation(null)
        break
      case 'edit':
        setEditingQuotation(quotation)
        setVersionsQuotation(null)
        break
      case 'duplicate':
        handleQuotationDuplicate(quotation)
        setVersionsQuotation(null)
        break
    }
  }

  const handleQuotationDownloadPDF = async (quotationId: string) => {
    // This will be handled by the individual quotation detail modal
    const quotation = quotations.find(q => q.id === quotationId)
    if (quotation) {
      setSelectedQuotation(quotation)
    }
  }

  const handleSendEmail = (quotation: Quotation) => {
    setSendingQuotation(quotation)
  }

  const handleEmailSent = () => {
    setSendingQuotation(null)
    loadQuotations() // Refresh to update status
  }

  const handleActivityCreated = () => {
    setShowCreateActivityModal(false)
    loadActivities() // Refresh activities list
  }

  // Activity handlers for drag & drop functionality
  const handleActivitiesReorder = (newActivities: any[]) => {
    setActivities(newActivities)
  }

  const handleActivityDelete = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId))
    updateOpportunityCounts(undefined, activities.length - 1)
  }

  const handleActivityToggleComplete = (activityId: string, completed: boolean) => {
    // Update local state - the DraggableActivitiesList already handles the API call
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, completedAt: completed ? new Date() : null }
          : activity
      )
    )
  }

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity)
  }

  if (!opportunity || !localOpportunity) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: keyof typeof STAGE_METADATA) => {
    const colors = {
      blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300',
      indigo: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300',
      purple: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300',
      orange: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300',
      yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300',
      green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300',
      red: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300',
      gray: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300',
    };
    return colors[STAGE_METADATA[stage].color as keyof typeof colors] || colors.gray;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-purple to-purple-700 text-white p-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="h-4 w-4" />
              </div>
              {opportunity.title}
            </DialogTitle>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={`${getStageColor(opportunity.stage)} border`}>
                {STAGE_METADATA[opportunity.stage].label}
              </Badge>
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{formatCurrency(opportunity.value)}</span>
              </div>
              <div className="flex items-center gap-1 text-white/90">
                <Percent className="h-4 w-4" />
                <span>{opportunity.probability}%</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onEdit && onEdit(opportunity)}
              className="bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            {onCreateActivity && (
              <Button 
                onClick={() => onCreateActivity(opportunity.id)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Activity className="h-4 w-4 mr-2" />
                Nueva Actividad
              </Button>
            )}
            <Button 
              onClick={() => setShowCreateQuotationModal(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
            <Link href={`/opportunities/${opportunity.id}`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver página completa
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Detalles
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Actividades ({localOpportunity?._count?.activities || activities.length})
              </TabsTrigger>
              <TabsTrigger value="quotations" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cotizaciones ({localOpportunity?._count?.quotations || quotations.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Documentos
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Info */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-success" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-lg">{formatCurrency(opportunity.value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Probabilidad:</span>
                  <span className="font-semibold">{opportunity.probability}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rev. Esperada:</span>
                  <span className="font-semibold text-success">{formatCurrency(opportunity.expectedRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Dates & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Creada:</span>
                  <span className="font-medium">{new Date(opportunity.createdAt).toLocaleDateString()}</span>
                </div>
                {opportunity.expectedCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cierre esperado:</span>
                    <span className="font-medium">{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {opportunity.actualCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cierre real:</span>
                    <span className="font-medium">{new Date(opportunity.actualCloseDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client/Lead Info */}
                {(opportunity.client || opportunity.lead) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {opportunity.client ? (
                          <>
                            <Building2 className="h-5 w-5 text-brand-purple" />
                            Cliente
                          </>
                        ) : (
                          <>
                            <User className="h-5 w-5 text-brand-blue" />
                            Prospecto
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {opportunity.client && (
                        <>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{opportunity.client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{opportunity.client.email}</span>
                          </div>
                        </>
                      )}
                      {opportunity.lead && (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{opportunity.lead.firstName} {opportunity.lead.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{opportunity.lead.email}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Assigned To */}
                {opportunity.assignedTo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-brand-green" />
                        Asignado a
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-purple to-purple-700 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {opportunity.assignedTo.firstName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}</div>
                          <div className="text-sm text-muted-foreground">{opportunity.assignedTo.email}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Description */}
              {opportunity.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-brand-blue" />
                      Descripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Competitive Info */}
              {opportunity.competitorInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      Información Competitiva
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.competitorInfo}</p>
                  </CardContent>
                </Card>
              )}

              {/* Lost Reason */}
              {opportunity.lostReason && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                      <Clock className="h-5 w-5" />
                      Razón de Pérdida
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700 whitespace-pre-wrap">{opportunity.lostReason}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-4 mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowCreateActivityModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nueva Actividad
                </Button>
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <DraggableActivitiesList
                  activities={activities}
                  onActivitiesReorder={handleActivitiesReorder}
                  onActivityDelete={handleActivityDelete}
                  onActivityToggleComplete={handleActivityToggleComplete}
                  onActivityClick={handleActivityClick}
                />
              )}
            </TabsContent>

            {/* Quotations Tab */}
            <TabsContent value="quotations" className="space-y-4 mt-4">
              <QuotationsList
                quotations={quotations}
                onEdit={handleQuotationEdit}
                onDelete={handleQuotationDelete}
                onView={handleQuotationView}
                onDuplicate={handleQuotationDuplicate}
                onChangeStatus={handleQuotationStatusChange}
                onCreateNew={() => setShowCreateQuotationModal(true)}
                onDownloadPDF={handleQuotationDownloadPDF}
                isLoading={isLoadingQuotations}
              />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <DocumentUpload
                opportunityId={opportunity.id}
                onUploadComplete={() => setDocumentsRefreshTrigger(Date.now())}
                className="mb-6"
              />
              <DocumentList
                opportunityId={opportunity.id}
                refreshTrigger={documentsRefreshTrigger}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Quotation Modal */}
        <CreateQuotationModal
          isOpen={showCreateQuotationModal}
          onClose={() => setShowCreateQuotationModal(false)}
          onQuotationCreated={handleQuotationCreated}
          opportunityId={opportunity.id}
          clientId={opportunity.client?.id}
          leadId={opportunity.lead?.id}
        />

        {/* Quotation Detail Modal */}
        <QuotationDetailModal
          quotation={selectedQuotation}
          isOpen={!!selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onEdit={handleQuotationEdit}
          onDelete={handleQuotationDelete}
          onDuplicate={handleQuotationDuplicate}
          onStatusChange={handleQuotationStatusChange}
          onSendEmail={handleSendEmail}
          onViewVersions={handleViewVersions}
        />

        {/* Edit Quotation Modal */}
        <EditQuotationModal
          quotation={editingQuotation}
          isOpen={!!editingQuotation}
          onClose={() => setEditingQuotation(null)}
          onQuotationUpdated={handleQuotationUpdated}
        />

        {/* Quotation Versions Modal */}
        <QuotationVersionsModal
          baseQuotation={versionsQuotation}
          isOpen={!!versionsQuotation}
          onClose={() => setVersionsQuotation(null)}
          onViewVersion={(quotation) => handleVersionAction('view', quotation)}
          onEditVersion={(quotation) => handleVersionAction('edit', quotation)}
          onDuplicateVersion={(quotation) => handleVersionAction('duplicate', quotation)}
        />

        {/* Send Quotation Email Modal */}
        <SendQuotationModal
          quotation={sendingQuotation}
          isOpen={!!sendingQuotation}
          onClose={() => setSendingQuotation(null)}
          onEmailSent={handleEmailSent}
        />

        {/* Create Activity Modal */}
        <CreateActivityModal
          isOpen={showCreateActivityModal}
          onClose={() => setShowCreateActivityModal(false)}
          onActivityCreated={handleActivityCreated}
          opportunityId={opportunity.id}
        />

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onActivityUpdated={() => {
            setSelectedActivity(null)
            loadActivities()
          }}
        />
      </DialogContent>
    </Dialog>
  );
}