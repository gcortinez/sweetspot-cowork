'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/shared/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  listOpportunities, 
  getOpportunityStats,
  changeOpportunityStage,
  deleteOpportunity 
} from '@/lib/actions/opportunities'
import { STAGE_METADATA } from '@/lib/validations/opportunities'
import { useToast } from '@/hooks/use-toast'
import CreateOpportunityModal from '@/components/opportunities/CreateOpportunityModal'
import EditOpportunityModal from '@/components/opportunities/EditOpportunityModal'
import OpportunityDetailModal from '@/components/opportunities/OpportunityDetailModal'
import CreateActivityModal from '@/components/activities/CreateActivityModal'
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRight,
  Trophy,
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  Square,
  CheckSquare,
  X,
  Bell,
  AlertTriangle,
  Building2,
  Loader2,
  Activity,
  MessageSquare
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

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
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [detailOpportunity, setDetailOpportunity] = useState<Opportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const [updatingOpportunities, setUpdatingOpportunities] = useState<Set<string>>(new Set())
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, { originalStage: keyof typeof STAGE_METADATA, newStage: keyof typeof STAGE_METADATA }>>(new Map())
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false)
  const [activityOpportunityId, setActivityOpportunityId] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Debounced search term to avoid excessive API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isFiltering, setIsFiltering] = useState(false)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load opportunities and stats when filters change
  useEffect(() => {
    const loadWithFiltering = async () => {
      setIsFiltering(true)
      await loadData()
      setIsFiltering(false)
    }
    loadWithFiltering()
  }, [debouncedSearchTerm, stageFilter])

  const loadData = React.useCallback(async () => {
    // Don't set loading to true if we're just filtering to avoid flash
    if (!isFiltering) setLoading(true)
    try {
      const filters: any = {}
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm
      if (stageFilter !== 'all') filters.stage = stageFilter

      const [opportunitiesResult, statsResult] = await Promise.all([
        listOpportunities(filters),
        getOpportunityStats()
      ])

      if (opportunitiesResult.success) {
        setOpportunities(opportunitiesResult.data)
      } else {
        toast({
          title: "Error",
          description: opportunitiesResult.error,
          variant: "destructive",
        })
      }

      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar las oportunidades",
        variant: "destructive",
      })
    } finally {
      if (!isFiltering) setLoading(false)
    }
  }, [debouncedSearchTerm, stageFilter, isFiltering])

  const loadStats = async () => {
    try {
      const statsResult = await getOpportunityStats()
      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Handle stage filter change to prevent page reload
  const handleStageFilterChange = React.useCallback((value: string) => {
    // Prevent any default behavior that might cause page reload
    setStageFilter(value)
  }, [])

  // Handle search input change
  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setSearchTerm(e.target.value)
  }, [])

  // Clear all filters
  const handleClearFilters = React.useCallback(() => {
    setSearchTerm('')
    setStageFilter('all')
  }, [])

  const handleStageChange = async (opportunityId: string, newStage: keyof typeof STAGE_METADATA) => {
    // 1. Perform optimistic update immediately
    updateOpportunityOptimistically(opportunityId, newStage)
    
    try {
      // 2. Call API in background
      const result = await changeOpportunityStage(opportunityId, { stage: newStage })
      
      if (result.success) {
        // 3. Confirm the update
        confirmOpportunityUpdate(opportunityId)
        
        // Show subtle success feedback
        toast({
          title: "Etapa actualizada",
          description: `Oportunidad movida a ${STAGE_METADATA[newStage].label}`,
          duration: 2000, // Shorter duration for less interruption
        })
        
        // Refresh stats without reloading opportunities
        loadStats()
      } else {
        // 4. Rollback on failure
        rollbackOpportunityUpdate(opportunityId)
        
        toast({
          title: "Error al actualizar",
          description: result.error || "No se pudo cambiar la etapa",
          variant: "destructive",
        })
      }
    } catch (error) {
      // 5. Rollback on error
      rollbackOpportunityUpdate(opportunityId)
      
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    if (bulkMode) return // Disable drag in bulk mode
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (bulkMode) return // Disable drag in bulk mode
    
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return
    
    const opportunityId = active.id as string
    const newStage = over.id as keyof typeof STAGE_METADATA
    
    // Find the opportunity being dragged
    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    if (!opportunity || opportunity.stage === newStage) return
    
    // Update stage via server action
    await handleStageChange(opportunityId, newStage)
  }

  // Handle edit opportunity
  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setIsEditModalOpen(true)
  }

  // Handle view opportunity detail
  const handleViewOpportunityDetail = (opportunity: Opportunity) => {
    setDetailOpportunity(opportunity)
    setIsDetailModalOpen(true)
  }

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setDetailOpportunity(null)
  }

  // Handle create activity
  const handleCreateActivity = (opportunityId: string) => {
    setActivityOpportunityId(opportunityId)
    setIsCreateActivityModalOpen(true)
  }

  // Handle delete opportunity
  const handleDeleteOpportunity = async (opportunityId: string, opportunityTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la oportunidad "${opportunityTitle}"?`)) {
      return
    }

    try {
      const result = await deleteOpportunity(opportunityId)
      
      if (result.success) {
        toast({
          title: "Oportunidad eliminada",
          description: `"${opportunityTitle}" ha sido eliminada exitosamente.`,
        })
        loadData() // Refresh opportunities and stats
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

  // Bulk operations handlers
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedOpportunities([])
  }

  const toggleOpportunitySelection = (opportunityId: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(opportunityId) 
        ? prev.filter(id => id !== opportunityId)
        : [...prev, opportunityId]
    )
  }

  const selectAllOpportunities = () => {
    setSelectedOpportunities(opportunities.map(opp => opp.id))
  }

  const clearSelection = () => {
    setSelectedOpportunities([])
  }

  const bulkStageChange = async (newStage: keyof typeof STAGE_METADATA) => {
    if (selectedOpportunities.length === 0) return

    try {
      const promises = selectedOpportunities.map(id => 
        changeOpportunityStage(id, { stage: newStage })
      )
      
      const results = await Promise.all(promises)
      const failedCount = results.filter(result => !result.success).length
      
      if (failedCount === 0) {
        toast({
          title: "Etapas actualizadas",
          description: `${selectedOpportunities.length} oportunidades movidas a ${STAGE_METADATA[newStage].label}`,
        })
      } else {
        toast({
          title: "Parcialmente completado",
          description: `${results.length - failedCount}/${results.length} oportunidades actualizadas`,
          variant: "destructive",
        })
      }
      
      setSelectedOpportunities([])
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar las etapas",
        variant: "destructive",
      })
    }
  }

  const bulkDelete = async () => {
    if (selectedOpportunities.length === 0) return

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedOpportunities.length} oportunidades seleccionadas?`)) {
      return
    }

    try {
      const promises = selectedOpportunities.map(id => deleteOpportunity(id))
      const results = await Promise.all(promises)
      const failedCount = results.filter(result => !result.success).length
      
      if (failedCount === 0) {
        toast({
          title: "Oportunidades eliminadas",
          description: `${selectedOpportunities.length} oportunidades eliminadas exitosamente`,
        })
      } else {
        toast({
          title: "Parcialmente completado",
          description: `${results.length - failedCount}/${results.length} oportunidades eliminadas`,
          variant: "destructive",
        })
      }
      
      setSelectedOpportunities([])
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar las oportunidades",
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

  // Optimistic update helpers
  const updateOpportunityOptimistically = (opportunityId: string, newStage: keyof typeof STAGE_METADATA) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    if (!opportunity) return

    const originalStage = opportunity.stage
    
    // Store the original stage for potential rollback
    setOptimisticUpdates(prev => new Map(prev).set(opportunityId, { originalStage, newStage }))
    
    // Update opportunities state immediately
    setOpportunities(prev => prev.map(opp => 
      opp.id === opportunityId 
        ? { ...opp, stage: newStage }
        : opp
    ))

    // Add to updating set
    setUpdatingOpportunities(prev => new Set(prev).add(opportunityId))
  }

  const rollbackOpportunityUpdate = (opportunityId: string) => {
    const update = optimisticUpdates.get(opportunityId)
    if (!update) return

    // Rollback to original stage
    setOpportunities(prev => prev.map(opp => 
      opp.id === opportunityId 
        ? { ...opp, stage: update.originalStage }
        : opp
    ))

    // Clean up
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(opportunityId)
      return newMap
    })
    
    setUpdatingOpportunities(prev => {
      const newSet = new Set(prev)
      newSet.delete(opportunityId)
      return newSet
    })
  }

  const confirmOpportunityUpdate = (opportunityId: string) => {
    // Clean up optimistic update state
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(opportunityId)
      return newMap
    })
    
    setUpdatingOpportunities(prev => {
      const newSet = new Set(prev)
      newSet.delete(opportunityId)
      return newSet
    })
  }

  // Pipeline health check functions
  const isStaleOpportunity = (opportunity: Opportunity) => {
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(opportunity.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceUpdate > 7 && !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)
  }

  const isOverdue = (opportunity: Opportunity) => {
    if (!opportunity.expectedCloseDate || ['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)) {
      return false
    }
    return new Date(opportunity.expectedCloseDate) < new Date()
  }

  const needsAttention = (opportunity: Opportunity) => {
    return isStaleOpportunity(opportunity) || isOverdue(opportunity)
  }

  const getHealthStatus = (opportunity: Opportunity) => {
    if (isOverdue(opportunity)) {
      return { type: 'overdue', message: 'Fecha de cierre vencida', color: 'text-red-600' }
    }
    if (isStaleOpportunity(opportunity)) {
      return { type: 'stale', message: 'Sin actividad por más de 7 días', color: 'text-orange-600' }
    }
    return null
  }

  const getStageColor = (stage: keyof typeof STAGE_METADATA) => {
    const colors = {
      blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-brand-blue border-blue-300 shadow-brand',
      indigo: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300 shadow-soft',
      purple: 'bg-gradient-to-r from-purple-100 to-pink-100 text-brand-purple border-purple-300 shadow-purple',
      orange: 'bg-gradient-to-r from-orange-100 to-amber-100 text-warning border-orange-300 shadow-soft',
      yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300 shadow-soft',
      green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-success border-green-300 shadow-soft',
      red: 'bg-gradient-to-r from-red-100 to-pink-100 text-destructive border-red-300 shadow-soft',
      gray: 'bg-gradient-to-r from-gray-100 to-slate-100 text-muted-foreground border-gray-300 shadow-soft',
    }
    return colors[STAGE_METADATA[stage].color as keyof typeof colors] || colors.gray
  }

  // Droppable stage column component
  const DroppableStage = ({ 
    stage, 
    opportunities: stageOpportunities, 
    children 
  }: { 
    stage: keyof typeof STAGE_METADATA
    opportunities: Opportunity[]
    children: React.ReactNode 
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: stage,
    })

    const stageMetadata = STAGE_METADATA[stage]
    
    // Calcular el valor total de las oportunidades en esta etapa
    const totalValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0)
    
    // Configuración de colores y estilos mejorados por etapa
    const stageConfig = {
      INITIAL_CONTACT: {
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50/80 to-indigo-50/80',
        icon: '👋',
        textColor: 'text-blue-700'
      },
      NEEDS_ANALYSIS: {
        gradient: 'from-purple-500 to-indigo-600', 
        bgGradient: 'from-purple-50/80 to-indigo-50/80',
        icon: '🔍',
        textColor: 'text-purple-700'
      },
      PROPOSAL_SENT: {
        gradient: 'from-pink-500 to-purple-600',
        bgGradient: 'from-pink-50/80 to-purple-50/80', 
        icon: '📝',
        textColor: 'text-pink-700'
      },
      NEGOTIATION: {
        gradient: 'from-orange-500 to-amber-600',
        bgGradient: 'from-orange-50/80 to-amber-50/80',
        icon: '🤝',
        textColor: 'text-orange-700'
      },
      CONTRACT_REVIEW: {
        gradient: 'from-yellow-500 to-orange-600',
        bgGradient: 'from-yellow-50/80 to-orange-50/80',
        icon: '📜',
        textColor: 'text-yellow-700'
      },
      CLOSED_WON: {
        gradient: 'from-green-500 to-emerald-600',
        bgGradient: 'from-green-50/80 to-emerald-50/80',
        icon: '✅',
        textColor: 'text-green-700'
      },
      CLOSED_LOST: {
        gradient: 'from-red-500 to-pink-600',
        bgGradient: 'from-red-50/80 to-pink-50/80',
        icon: '❌',
        textColor: 'text-red-700'
      },
      ON_HOLD: {
        gradient: 'from-gray-500 to-slate-600',
        bgGradient: 'from-gray-50/80 to-slate-50/80',
        icon: '⏸️',
        textColor: 'text-gray-700'
      }
    }
    
    const config = stageConfig[stage] || stageConfig.INITIAL_CONTACT
    
    return (
      <div className="min-h-[480px] bg-white rounded-xl shadow-soft border border-border hover:shadow-medium transition-all duration-300">
        {/* Header mejorado */}
        <div className={`relative p-4 rounded-t-xl bg-gradient-to-r ${config.gradient} text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{config.icon}</span>
                <h3 className="font-semibold text-sm">{stageMetadata.label}</h3>
              </div>
              <div className="bg-white/20 rounded-full px-2 py-1">
                <span className="text-xs font-medium">{stageOpportunities.length}</span>
              </div>
            </div>
            
            {/* Valor total de la etapa */}
            <div className="flex items-center justify-between text-white/90">
              <span className="text-xs">Valor Total:</span>
              <span className="text-xs font-medium">{formatCurrency(totalValue)}</span>
            </div>
            
            {/* Barra de progreso */}
            <div className="mt-2 w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stageOpportunities.length / (opportunities.length || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Contenido de las tarjetas */}
        <div 
          ref={setNodeRef}
          className={`bg-gradient-to-b ${config.bgGradient} min-h-[400px] p-3 rounded-b-xl transition-all duration-300 ${
            isOver ? 'bg-brand-purple/10 ring-2 ring-brand-purple/50 shadow-lg' : ''
          }`}
        >
          <div className="space-y-3">
            {children}
          </div>
          
          {/* Indicador de zona de drop */}
          {isOver && (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-brand-purple/30 rounded-lg mt-3">
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm text-brand-purple font-medium">Suelta aquí</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Draggable opportunity card component
  const DraggableOpportunityCard = React.memo(({ opportunity }: { opportunity: Opportunity }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: opportunity.id,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : updatingOpportunities.has(opportunity.id) ? 0.8 : 1,
    }

    const healthStatus = getHealthStatus(opportunity)

    // Debug - verificar datos del cliente
    console.log('Opportunity client info:', {
      id: opportunity.id,
      title: opportunity.title,
      client: opportunity.client,
      lead: opportunity.lead
    })

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...(bulkMode ? {} : listeners)}
        onClick={bulkMode ? () => toggleOpportunitySelection(opportunity.id) : (e) => {
          // Solo abrir modal si no se hizo clic en botones de acción y no se está haciendo drag
          if (!e.target.closest('button') && !e.target.closest('[role="menuitem"]') && !isDragging) {
            handleViewOpportunityDetail(opportunity)
          }
        }}
      >
        <Card className={`mb-3 hover:shadow-xl transition-all duration-300 hover-lift border-0 shadow-md rounded-lg overflow-hidden relative ${
          bulkMode ? 'cursor-pointer' : isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:cursor-grab'
        } ${selectedOpportunities.includes(opportunity.id) ? 'ring-2 ring-brand-purple bg-gradient-to-r from-purple-50 to-indigo-50' : 'bg-white hover:bg-gradient-to-r hover:from-white hover:to-gray-50/50'} ${updatingOpportunities.has(opportunity.id) ? 'ring-2 ring-blue-300 bg-blue-50/30' : ''}`}>
          <CardContent className="p-0">
            {/* Loading indicator */}
            {updatingOpportunities.has(opportunity.id) && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              </div>
            )}
            
            {/* Header de la tarjeta */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-3 border-b border-gray-100">
              <div className="flex justify-between items-start mb-1">
                {bulkMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 mr-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOpportunitySelection(opportunity.id)
                    }}
                  >
                    {selectedOpportunities.includes(opportunity.id) ? (
                      <CheckSquare className="h-4 w-4 text-brand-purple" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
                <div className="font-semibold text-sm truncate flex-1 text-gray-900">
                  {opportunity.title}
                </div>
                <div className="flex items-center space-x-1">
                  {healthStatus && (
                    <div className="group relative">
                      {healthStatus.type === 'overdue' ? (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      ) : (
                        <Bell className="h-3 w-3 text-orange-600" />
                      )}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {healthStatus.message}
                        </div>
                      </div>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/opportunities/${opportunity.id}`}>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Ver Detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOpportunity(opportunity)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateActivity(opportunity.id)
                        }}
                      >
                        <Activity className="h-3 w-3 mr-2" />
                        Nueva Actividad
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteOpportunity(opportunity.id, opportunity.title)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="p-3">
              {/* Badge de valor prominente */}
              <div className="flex items-center justify-between mb-3">
                <div className="bg-gradient-to-r from-success/10 to-emerald-100 text-success font-bold text-sm px-3 py-1 rounded-full border border-success/20">
                  {formatCurrency(opportunity.value)}
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium text-xs px-2 py-1 rounded-full">
                  {opportunity.probability}%
                </div>
              </div>
              
              {/* Información compacta */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1 text-success" />
                    Rev. Esperada:
                  </span>
                  <span className="font-medium text-success">
                    {formatCurrency(opportunity.expectedRevenue)}
                  </span>
                </div>
                
                {/* Cliente o Lead */}
                {opportunity.client && (
                  <div className="flex items-center text-xs bg-gradient-to-r from-slate-50 to-gray-50 px-2 py-1 rounded-md border border-gray-200">
                    <Building2 className="h-3 w-3 mr-1 text-slate-600" />
                    <span className="truncate text-slate-700 font-medium">
                      Cliente: {opportunity.client.name}
                    </span>
                  </div>
                )}
                
                {!opportunity.client && opportunity.lead && (
                  <div className="flex items-center text-xs bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1 rounded-md border border-blue-200">
                    <User className="h-3 w-3 mr-1 text-blue-600" />
                    <span className="truncate text-blue-700 font-medium">
                      Prospecto: {opportunity.lead.firstName} {opportunity.lead.lastName}
                    </span>
                  </div>
                )}
                
                {/* Debug info */}
                {!opportunity.client && !opportunity.lead && (
                  <div className="flex items-center text-xs bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">
                    <span className="text-yellow-700">Sin cliente/prospecto asignado</span>
                  </div>
                )}
                
                {opportunity.assignedTo && (
                  <div className="flex items-center text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-brand-purple to-purple-700 flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-medium">
                        {opportunity.assignedTo.firstName.charAt(0)}
                      </span>
                    </div>
                    <span className="truncate">
                      {opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}
                    </span>
                  </div>
                )}
                
                {opportunity.expectedCloseDate && (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  })

  const renderOpportunityCard = (opportunity: Opportunity) => (
    <Card key={opportunity.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm truncate flex-1">{opportunity.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-3 w-3 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-3 w-3 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2 text-xs text-gray-600">
          {/* Cliente información */}
          {opportunity.client && (
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Building2 className="h-3 w-3" />
              <span className="font-medium text-xs truncate">{opportunity.client.name}</span>
            </div>
          )}
          {opportunity.lead && !opportunity.client && (
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <User className="h-3 w-3" />
              <span className="font-medium text-xs truncate">
                {opportunity.lead.firstName} {opportunity.lead.lastName}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Valor:</span>
            <span className="font-medium">{formatCurrency(opportunity.value)}</span>
          </div>
          <div className="flex justify-between">
            <span>Probabilidad:</span>
            <span className="font-medium">{opportunity.probability}%</span>
          </div>
          <div className="flex justify-between">
            <span>Rev. Esperada:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(opportunity.expectedRevenue)}
            </span>
          </div>
        </div>


        {opportunity.assignedTo && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <User className="h-3 w-3 mr-1" />
            {opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}
          </div>
        )}

        {opportunity.expectedCloseDate && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderKanbanView = () => {
    const stageOrder: (keyof typeof STAGE_METADATA)[] = [
      'INITIAL_CONTACT',
      'NEEDS_ANALYSIS', 
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'CONTRACT_REVIEW',
      'CLOSED_WON',
      'CLOSED_LOST',
      'ON_HOLD'
    ]

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6">
          {stageOrder.map((stage) => {
            const stageOpportunities = opportunities.filter(opp => opp.stage === stage)
            
            return (
              <DroppableStage 
                key={stage} 
                stage={stage} 
                opportunities={stageOpportunities}
              >
                <SortableContext
                  items={stageOpportunities.map(opp => opp.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stageOpportunities.map(opportunity => (
                    <DraggableOpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))}
                </SortableContext>
              </DroppableStage>
            )
          })}
        </div>
        <DragOverlay>
          {activeId ? (
            <DraggableOpportunityCard 
              opportunity={opportunities.find(opp => opp.id === activeId)!} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }

  const renderListView = () => (
    <div className="space-y-2">
      {opportunities.map((opportunity) => (
        <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Link 
                    href={`/opportunities/${opportunity.id}`}
                    className="font-medium hover:text-brand-purple transition-colors"
                  >
                    {opportunity.title}
                  </Link>
                  <Badge className={getStageColor(opportunity.stage)}>
                    {STAGE_METADATA[opportunity.stage].label}
                  </Badge>
                </div>
                {/* Cliente información */}
                {opportunity.client && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">{opportunity.client.name}</span>
                    <span className="text-xs text-muted-foreground">({opportunity.client.email})</span>
                  </div>
                )}
                {opportunity.lead && !opportunity.client && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-600 font-medium">
                      {opportunity.lead.firstName} {opportunity.lead.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">({opportunity.lead.email})</span>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Valor: </span>
                    {formatCurrency(opportunity.value)}
                  </div>
                  <div>
                    <span className="font-medium">Probabilidad: </span>
                    {opportunity.probability}%
                  </div>
                  <div>
                    <span className="font-medium">Rev. Esperada: </span>
                    <span className="text-success">{formatCurrency(opportunity.expectedRevenue)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Asignado: </span>
                    {opportunity.assignedTo ? 
                      `${opportunity.assignedTo.firstName} ${opportunity.assignedTo.lastName}` : 
                      'Sin asignar'
                    }
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/opportunities/${opportunity.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditOpportunity(opportunity)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleDeleteOpportunity(opportunity.id, opportunity.title)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader 
          currentPage="Oportunidades"
          showBreadcrumb={true}
          breadcrumbItems={[{ label: 'Oportunidades' }]}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando oportunidades...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        currentPage="Oportunidades"
        showBreadcrumb={true}
        breadcrumbItems={[{ label: 'Oportunidades' }]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Health Alerts */}
        {opportunities.some(needsAttention) && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900">
                  Oportunidades que requieren atención
                </h3>
                <div className="mt-2 space-y-1">
                  {opportunities.filter(needsAttention).slice(0, 3).map(opportunity => {
                    const status = getHealthStatus(opportunity)
                    return (
                      <div key={opportunity.id} className="flex items-center justify-between">
                        <Link 
                          href={`/opportunities/${opportunity.id}`}
                          className="text-sm text-orange-800 hover:text-orange-900 font-medium"
                        >
                          {opportunity.title}
                        </Link>
                        <span className="text-xs text-orange-600">
                          {status?.message}
                        </span>
                      </div>
                    )
                  })}
                  {opportunities.filter(needsAttention).length > 3 && (
                    <p className="text-xs text-orange-600 mt-2">
                      +{opportunities.filter(needsAttention).length - 3} más requieren atención
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-purple hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-brand-purple" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Oportunidades</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.overall.totalOpportunities}
                    </p>
                    <p className="text-xs text-brand-purple flex items-center mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      Pipeline activo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-soft hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Valor Total Pipeline</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(stats.overall.totalValue)}
                    </p>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Potencial de ingresos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-brand hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-brand-blue" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Revenue Esperado</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(stats.overall.totalExpectedRevenue)}
                    </p>
                    <p className="text-xs text-brand-blue flex items-center mt-1">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Proyección de cierre
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-soft hover-lift transition-all">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-warning" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.overall.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-warning flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Eficiencia del pipeline
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Analytics */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Pipeline Velocity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Velocidad del Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Tiempo promedio de conversión</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {stats.overall.averageConversionTime || 'N/A'} días
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Oportunidades activas</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {opportunities.filter(opp => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage)).length}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Cerradas este mes</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      {opportunities.filter(opp => 
                        ['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage) &&
                        opp.actualCloseDate &&
                        new Date(opp.actualCloseDate).getMonth() === new Date().getMonth()
                      ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Proyección de Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Cerrar este mes</span>
                    </div>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(
                        opportunities
                          .filter(opp => 
                            opp.expectedCloseDate &&
                            new Date(opp.expectedCloseDate).getMonth() === new Date().getMonth() &&
                            !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage)
                          )
                          .reduce((sum, opp) => sum + opp.expectedRevenue, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Próximo trimestre</span>
                    </div>
                    <p className="text-lg font-bold text-brand-blue">
                      {formatCurrency(
                        opportunities
                          .filter(opp => {
                            if (!opp.expectedCloseDate || ['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage)) return false
                            const closeDate = new Date(opp.expectedCloseDate)
                            const now = new Date()
                            const nextQuarter = new Date(now.getFullYear(), now.getMonth() + 3, 1)
                            return closeDate <= nextQuarter
                          })
                          .reduce((sum, opp) => sum + opp.expectedRevenue, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Confiabilidad promedio</span>
                    </div>
                    <p className="text-lg font-bold text-warning">
                      {opportunities.length > 0 ? 
                        (opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length).toFixed(1) : 0
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2" />
                  Distribución por Etapa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(STAGE_METADATA).map(([stage, metadata]) => {
                    const stageOpportunities = opportunities.filter(opp => opp.stage === stage)
                    const percentage = opportunities.length > 0 ? 
                      (stageOpportunities.length / opportunities.length) * 100 : 0
                    
                    return (
                      <div key={stage} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            metadata.color === 'blue' ? 'bg-blue-500' :
                            metadata.color === 'indigo' ? 'bg-indigo-500' :
                            metadata.color === 'purple' ? 'bg-purple-500' :
                            metadata.color === 'orange' ? 'bg-orange-500' :
                            metadata.color === 'yellow' ? 'bg-yellow-500' :
                            metadata.color === 'green' ? 'bg-green-500' :
                            metadata.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="text-sm text-muted-foreground">{metadata.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{stageOpportunities.length}</span>
                          <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              {searchTerm !== debouncedSearchTerm && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="relative">
              <Select value={stageFilter} onValueChange={handleStageFilterChange} disabled={isFiltering}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {Object.entries(STAGE_METADATA).map(([stage, metadata]) => (
                    <SelectItem key={stage} value={stage}>
                      {metadata.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFiltering && (
                <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Clear filters button */}
            {(searchTerm || stageFilter !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
              <TabsList>
                <TabsTrigger value="kanban">Pipeline</TabsTrigger>
                <TabsTrigger value="list">Lista</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button
              variant={bulkMode ? "secondary" : "outline"}
              onClick={toggleBulkMode}
            >
              {bulkMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Seleccionar
                </>
              )}
            </Button>
            
            <CreateOpportunityModal onOpportunityCreated={() => { loadData(); loadStats(); }} />
            
            <Link href="/quotations">
              <Button 
                variant="outline" 
                className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cotización
              </Button>
            </Link>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {bulkMode && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6 shadow-purple">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-brand-purple">
                  {selectedOpportunities.length} oportunidades seleccionadas
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllOpportunities} className="border-brand-purple text-brand-purple hover:bg-brand-purple/10">
                    Seleccionar todas ({opportunities.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection} className="border-brand-purple text-brand-purple hover:bg-brand-purple/10">
                    Limpiar selección
                  </Button>
                </div>
              </div>
              
              {selectedOpportunities.length > 0 && (
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-brand-purple to-purple-700 hover:from-brand-purple/90 hover:to-purple-700/90 shadow-purple">
                        Cambiar etapa
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(STAGE_METADATA).map(([stage, metadata]) => (
                        <DropdownMenuItem 
                          key={stage}
                          onClick={() => bulkStageChange(stage as keyof typeof STAGE_METADATA)}
                        >
                          {metadata.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={bulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar ({selectedOpportunities.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {/* Show filtering indicator */}
            {isFiltering && (
              <div className="flex items-center justify-center py-4 mb-4 bg-gray-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-brand-purple" />
                <span className="text-sm text-gray-600">Filtrando oportunidades...</span>
              </div>
            )}
            
            {view === 'kanban' ? renderKanbanView() : renderListView()}
            
            {opportunities.length === 0 && !isFiltering && !loading && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay oportunidades
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera oportunidad o convirtiendo un prospecto.
                </p>
                <CreateOpportunityModal onOpportunityCreated={() => { loadData(); loadStats(); }} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Opportunity Modal */}
      {editingOpportunity && (
        <EditOpportunityModal
          opportunity={editingOpportunity}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingOpportunity(null)
          }}
          onOpportunityUpdated={() => { loadData(); loadStats(); }}
        />
      )}

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={detailOpportunity}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={(opportunity) => {
          handleCloseDetailModal()
          handleEditOpportunity(opportunity)
        }}
        onCreateActivity={(opportunityId) => {
          handleCloseDetailModal()
          handleCreateActivity(opportunityId)
        }}
      />

      {/* Create Activity Modal */}
      {isCreateActivityModalOpen && activityOpportunityId && (
        <CreateActivityModal
          isOpen={isCreateActivityModalOpen}
          onClose={() => {
            setIsCreateActivityModalOpen(false)
            setActivityOpportunityId(null)
          }}
          onActivityCreated={() => {
            setIsCreateActivityModalOpen(false)
            setActivityOpportunityId(null)
            // Could refresh opportunities if needed
          }}
          opportunityId={activityOpportunityId}
        />
      )}
    </div>
  )
}