'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  UserCheck,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Star,
  MapPin,
  ArrowLeft,
  Bell,
  Home
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { SignOutButton } from '@clerk/nextjs'
import { PermissionGuard } from '@/components/guards/PermissionGuard'
import { CanAccess } from '@/components/guards/CanAccess'
import { Resource } from '@/lib/auth/permissions'
import { useCRMPermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import CreateLeadModal from '@/components/leads/CreateLeadModal'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import EditLeadModal from '@/components/leads/EditLeadModal'
import ConvertToOpportunityModal from '@/components/leads/ConvertToOpportunityModal'
import { useApi } from '@/hooks/use-api'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: 'WEBSITE' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'COLD_CALL' | 'EMAIL_CAMPAIGN' | 'WALK_IN' | 'PARTNER' | 'OTHER'
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST'
  score?: number
  budget?: number
  interests?: string[]
  assignedToId?: string
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
  updatedAt: string
}

const SOURCE_LABELS = {
  WEBSITE: 'Sitio Web',
  REFERRAL: 'Referencia',
  SOCIAL_MEDIA: 'Redes Sociales',
  COLD_CALL: 'Llamada en Frío',
  EMAIL_CAMPAIGN: 'Campaña de Email',
  WALK_IN: 'Visita Directa',
  PARTNER: 'Socio',
  OTHER: 'Otro'
}

const STATUS_LABELS = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  UNQUALIFIED: 'No Calificado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido'
}

const STATUS_COLORS = {
  NEW: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
  CONTACTED: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200',
  QUALIFIED: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
  UNQUALIFIED: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200',
  CONVERTED: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200',
  LOST: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
}

const SOURCE_COLORS = {
  WEBSITE: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
  REFERRAL: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
  SOCIAL_MEDIA: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200',
  COLD_CALL: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200',
  EMAIL_CAMPAIGN: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200',
  WALK_IN: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200',
  PARTNER: 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border border-teal-200',
  OTHER: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
}

function LeadsPageContent() {
  const { user } = useUser()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showConverted, setShowConverted] = useState<boolean>(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const { toast } = useToast()
  const api = useApi()
  const router = useRouter()

  // Use RBAC permissions instead of manual role checking
  const crmPermissions = useCRMPermissions()


  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/api/leads')
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText || 'Error al cargar prospectos'}`)
      }
      
      const data = await response.json()
      console.log('Leads loaded:', data)
      console.log('Data structure:', JSON.stringify(data, null, 2))
      
      // Handle different response structures
      let leadsArray: Lead[] = []
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          leadsArray = data.data
        } else if (data.data.leads && Array.isArray(data.data.leads)) {
          leadsArray = data.data.leads
        }
      } else if (Array.isArray(data)) {
        leadsArray = data
      }
      
      console.log('Processed leads array:', leadsArray)
      console.log('Number of leads:', leadsArray.length)
      
      // Debug individual leads
      if (leadsArray.length > 0) {
        console.log('First lead details:', JSON.stringify(leadsArray[0], null, 2))
      }
      
      setLeads(leadsArray)
    } catch (error) {
      console.error('Error loading leads:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar prospectos'
      toast({
        title: 'Error al cargar prospectos',
        description: errorMessage,
        variant: 'destructive'
      })
      setLeads([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeadCreated = () => {
    loadLeads()
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowEditModal(true)
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await api.delete(`/api/leads/${leadId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText || 'Error al eliminar el prospecto'}`)
      }
      
      toast({
        title: 'Prospecto eliminado',
        description: 'El prospecto ha sido eliminado exitosamente'
      })
      loadLeads()
    } catch (error) {
      console.error('Error deleting lead:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el prospecto'
      toast({
        title: 'Error al eliminar',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const filteredLeads = leads.filter(lead => {
    // Hide converted prospects unless explicitly shown
    if (lead.status === 'CONVERTED' && !showConverted) return false
    
    const matchesSearch = searchTerm === '' || 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })
  
  // Debug filtering
  console.log('Total leads before filter:', leads.length)
  console.log('Filtered leads count:', filteredLeads.length)
  console.log('Current filters:', { searchTerm, statusFilter, sourceFilter })
  if (leads.length > 0 && filteredLeads.length === 0) {
    console.log('All leads were filtered out. Sample lead:', JSON.stringify(leads[0], null, 2))
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score?: number) => {
    if (!score) return AlertCircle
    if (score >= 80) return CheckCircle
    if (score >= 60) return Clock
    return AlertCircle
  }

  const activeLeads = leads.filter(l => l.status !== 'CONVERTED')
  const stats = {
    total: activeLeads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length
  }

  return (
    <div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-500 hover:text-purple-600 transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Volver al Dashboard</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Prospectos</h1>
                <p className="text-gray-600">Administra y da seguimiento a tus leads</p>
              </div>
            </div>
            <CanAccess permission={Resource.PROSPECT_CREATE}>
              <CreateLeadModal onLeadCreated={handleLeadCreated} />
            </CanAccess>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                Total activos
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Recién ingresados
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calificados</p>
              <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Listos para venta
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Convertidos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <Target className="h-3 w-3 mr-1" />
                Oportunidades creadas
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
                <p className="text-sm text-gray-600">Encuentra prospectos específicos usando los filtros</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
            <Checkbox
              id="show-converted"
              checked={showConverted}
              onCheckedChange={(checked) => setShowConverted(checked as boolean)}
            />
            <label
              htmlFor="show-converted"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Mostrar convertidos
            </label>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Prospectos</h3>
                  <p className="text-sm text-gray-600">Gestiona todos tus leads y oportunidades potenciales</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {filteredLeads.length} de {showConverted ? leads.length : activeLeads.length} prospectos
              </div>
            </div>
          </div>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prospecto</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2 py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600">Cargando prospectos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No se encontraron prospectos</p>
                    <p className="text-sm">Intenta ajustar los filtros o crear un nuevo prospecto</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => {
                const ScoreIcon = getScoreIcon(lead.score)
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {lead.company && (
                          <div className="font-medium text-foreground">{lead.company}</div>
                        )}
                        {lead.position && (
                          <div className="text-sm text-muted-foreground">{lead.position}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {lead.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${SOURCE_COLORS[lead.source]} font-medium rounded-full`}>
                        {SOURCE_LABELS[lead.source]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${STATUS_COLORS[lead.status]} font-medium rounded-full`}>
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.score ? (
                        <div className={`flex items-center ${getScoreColor(lead.score)}`}>
                          <ScoreIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{lead.score}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.budget ? (
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${lead.budget.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          {crmPermissions.prospects.canEdit && (
                            <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {crmPermissions.prospects.canDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
          </Table>
        </div>
      </div>

        {/* Modals */}
        {selectedLead && (
          <>
            <LeadDetailModal
              lead={selectedLead}
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedLead(null)
              }}
              onCreateOpportunity={(lead) => {
                setShowDetailModal(false)
                setShowConvertModal(true)
              }}
              onUpdateScore={async (leadId, newScore) => {
                try {
                  console.log('Updating score for lead:', leadId, 'to:', newScore)
                  
                  // Update lead via API
                  const response = await api.put(`/api/leads/${leadId}`, { score: newScore })
                  
                  if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar la puntuación'}`)
                  }
                  
                  // Update the lead in the main state
                  setLeads(prev => prev.map(lead => 
                    lead.id === leadId ? { ...lead, score: newScore } : lead
                  ))
                  
                  // Also update the selected lead if it's the same
                  if (selectedLead?.id === leadId) {
                    setSelectedLead(prev => prev ? { ...prev, score: newScore } : null)
                  }
                  
                  // Show success message
                  toast({
                    title: '¡Puntuación actualizada!',
                    description: `La puntuación se ha actualizado a ${newScore}`,
                  })
                } catch (error) {
                  console.error('Error updating lead score:', error)
                  const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar la puntuación'
                  toast({
                    title: 'Error al actualizar puntuación',
                    description: errorMessage,
                    variant: 'destructive'
                  })
                  throw error // Re-throw to let the modal know there was an error
                }
              }}
            />
            <EditLeadModal
              lead={selectedLead}
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setSelectedLead(null)
              }}
              onLeadUpdated={handleLeadCreated}
            />

            <ConvertToOpportunityModal
              lead={selectedLead}
              isOpen={showConvertModal}
              onClose={() => {
                setShowConvertModal(false)
                setSelectedLead(null)
              }}
              onSuccess={(opportunityId) => {
                toast({
                  title: '¡Conversión exitosa!',
                  description: `Se ha creado la oportunidad correctamente.`,
                  duration: 3000, // Auto-close after 3 seconds
                })
                setShowConvertModal(false)
                setSelectedLead(null)
                loadLeads() // Refresh the leads list
                router.push(`/opportunities/${opportunityId}`)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

// Main page component with permission protection
export default function LeadsPage() {
  return (
    <PermissionGuard 
      require={Resource.PROSPECT_VIEW}
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-gray-600">
              No tienes permisos para ver los prospectos.
            </p>
          </div>
        </div>
      }
    >
      <LeadsPageContent />
    </PermissionGuard>
  )
}