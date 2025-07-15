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
import { AppHeader } from '@/components/shared/app-header'
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
import { useToast } from '@/hooks/use-toast'
import CreateLeadModal from '@/components/leads/CreateLeadModal'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import EditLeadModal from '@/components/leads/EditLeadModal'
import { useApi } from '@/hooks/use-api'
import { convertLeadToOpportunity } from '@/lib/actions/opportunities'
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
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  UNQUALIFIED: 'bg-gray-100 text-gray-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
  LOST: 'bg-red-100 text-red-800'
}

const SOURCE_COLORS = {
  WEBSITE: 'bg-blue-100 text-blue-700',
  REFERRAL: 'bg-green-100 text-green-700',
  SOCIAL_MEDIA: 'bg-pink-100 text-pink-700',
  COLD_CALL: 'bg-orange-100 text-orange-700',
  EMAIL_CAMPAIGN: 'bg-purple-100 text-purple-700',
  WALK_IN: 'bg-indigo-100 text-indigo-700',
  PARTNER: 'bg-teal-100 text-teal-700',
  OTHER: 'bg-gray-100 text-gray-700'
}

export default function LeadsPage() {
  const { user } = useUser()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { toast } = useToast()
  const api = useApi()
  const router = useRouter()

  // Check if user is Super Admin
  const privateMetadata = user?.privateMetadata as any
  const publicMetadata = user?.publicMetadata as any
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'


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
    const matchesSearch = searchTerm === '' || 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

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

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader 
        currentPage="Prospectos"
        showBreadcrumb={true}
        breadcrumbItems={[
          { label: 'Prospectos' }
        ]}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Volver al Dashboard</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-blue to-cowork-primary flex items-center justify-center shadow-brand">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Prospectos</h1>
                <p className="text-muted-foreground">Administra y da seguimiento a tus leads</p>
              </div>
            </div>
            <CreateLeadModal onLeadCreated={handleLeadCreated} />
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border shadow-soft hover-lift transition-theme">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-brand-blue flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                Total prospectos
              </p>
            </div>
            <Users className="h-8 w-8 text-brand-blue" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-soft hover-lift transition-theme">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nuevos</p>
              <p className="text-2xl font-bold text-brand-blue">{stats.new}</p>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Recién ingresados
              </p>
            </div>
            <Star className="h-8 w-8 text-brand-blue" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-soft hover-lift transition-theme">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Calificados</p>
              <p className="text-2xl font-bold text-success">{stats.qualified}</p>
              <p className="text-xs text-success flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Listos para venta
              </p>
            </div>
            <Target className="h-8 w-8 text-success" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-soft hover-lift transition-theme">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convertidos</p>
              <p className="text-2xl font-bold text-brand-purple">{stats.converted}</p>
              <p className="text-xs text-brand-purple flex items-center mt-1">
                <Target className="h-3 w-3 mr-1" />
                Oportunidades creadas
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-brand-purple" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="bg-card rounded-lg shadow-soft border">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-brand-blue" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Filtros de Búsqueda</h3>
                <p className="text-sm text-muted-foreground">Encuentra prospectos específicos usando los filtros</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="mb-8">
        <div className="bg-card rounded-lg shadow-soft border">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-brand-blue" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lista de Prospectos</h3>
                  <p className="text-sm text-muted-foreground">Gestiona todos tus leads y oportunidades potenciales</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredLeads.length} de {leads.length} prospectos
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue"></div>
                    <span className="text-muted-foreground">Cargando prospectos...</span>
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
                      <Badge variant="secondary" className={`${SOURCE_COLORS[lead.source]} font-medium`}>
                        {SOURCE_LABELS[lead.source]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${STATUS_COLORS[lead.status]} font-medium`}>
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
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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
              onCreateOpportunity={async (lead) => {
                try {
                  const result = await convertLeadToOpportunity(lead.id, {
                    title: `Oportunidad - ${lead.firstName} ${lead.lastName}`,
                    description: `Oportunidad creada a partir del prospecto: ${lead.firstName} ${lead.lastName} (${lead.email})`,
                    value: lead.budget || 1000000, // Default value if no budget
                    probability: 25, // Default 25% probability
                    stage: 'INITIAL_CONTACT'
                  })

                  if (result.success) {
                    toast({
                      title: '¡Oportunidad creada exitosamente!',
                      description: `Se ha creado una oportunidad para ${lead.firstName} ${lead.lastName}`,
                    })
                    setShowDetailModal(false)
                    setSelectedLead(null)
                    // Navigate to the new opportunity
                    router.push(`/opportunities/${result.data.id}`)
                  } else {
                    throw new Error(result.error || 'Error al crear la oportunidad')
                  }
                } catch (error) {
                  console.error('Error creating opportunity from lead:', error)
                  toast({
                    title: 'Error al crear oportunidad',
                    description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
                    variant: 'destructive'
                  })
                }
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
          </>
        )}
      </main>
    </div>
  )
}