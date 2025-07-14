'use client'

import React, { useState, useEffect } from 'react'
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
  MapPin
} from 'lucide-react'
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
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { toast } = useToast()

  // Mock data for demonstration - replace with actual API call
  const mockLeads: Lead[] = [
    {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
      phone: '+56 9 8877 6655',
      company: 'Tech Solutions',
      position: 'Director de TI',
      source: 'WEBSITE',
      status: 'NEW',
      score: 85,
      budget: 500000,
      interests: ['Coworking', 'Oficina Privada'],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2', 
      firstName: 'María',
      lastName: 'González',
      email: 'maria@startup.cl',
      phone: '+56 9 7766 5544',
      company: 'Startup Innovadora',
      position: 'CEO',
      source: 'REFERRAL',
      status: 'QUALIFIED',
      score: 92,
      budget: 800000,
      interests: ['Oficina Privada', 'Salas de Reunión'],
      assignedTo: {
        id: 'user1',
        firstName: 'Carlos',
        lastName: 'Vendedor'
      },
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      firstName: 'Pedro',
      lastName: 'Martínez',
      email: 'pedro@consultora.com',
      company: 'Consultora Ágil',
      position: 'Consultor Senior',
      source: 'SOCIAL_MEDIA',
      status: 'CONTACTED',
      score: 78,
      budget: 300000,
      interests: ['Coworking'],
      createdAt: '2024-01-13T16:45:00Z',
      updatedAt: '2024-01-14T11:30:00Z'
    }
  ]

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/leads')
      // const data = await response.json()
      // setLeads(data.leads || [])
      
      // Using mock data for now
      setTimeout(() => {
        setLeads(mockLeads)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: 'Error al cargar prospectos',
        description: 'Hubo un problema al cargar los prospectos',
        variant: 'destructive'
      })
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
      // TODO: Implement delete API call
      toast({
        title: 'Prospecto eliminado',
        description: 'El prospecto ha sido eliminado exitosamente'
      })
      loadLeads()
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: 'Hubo un problema al eliminar el prospecto',
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Prospectos</h1>
            <p className="text-gray-600">Administra y da seguimiento a tus leads</p>
          </div>
        </div>
        <CreateLeadModal onLeadCreated={handleLeadCreated} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            </div>
            <Star className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calificados</p>
              <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Convertidos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
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

      {/* Leads Table */}
      <div className="bg-white rounded-lg border shadow-sm">
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
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Cargando prospectos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron prospectos</p>
                    <p className="text-sm">Intenta ajustar los filtros o crear un nuevo prospecto</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => {
                const ScoreIcon = getScoreIcon(lead.score)
                return (
                  <TableRow key={lead.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {lead.company && (
                          <div className="font-medium text-gray-900">{lead.company}</div>
                        )}
                        {lead.position && (
                          <div className="text-sm text-gray-500">{lead.position}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {lead.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={SOURCE_COLORS[lead.source]}>
                        {SOURCE_LABELS[lead.source]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[lead.status]}>
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
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.budget ? (
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${lead.budget.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
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
    </div>
  )
}