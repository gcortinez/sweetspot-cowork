"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Star,
} from "lucide-react";
import CreateLeadModal from "@/components/leads/CreateLeadModal";
import LeadDetailModal from "@/components/leads/LeadDetailModal";
import EditLeadModal from "@/components/leads/EditLeadModal";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Pagination } from "@/components/ui/pagination";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST' | 'DORMANT';
  score: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'NEW': return 'bg-blue-100 text-blue-800';
    case 'CONTACTED': return 'bg-yellow-100 text-yellow-800';
    case 'QUALIFIED': return 'bg-green-100 text-green-800';
    case 'UNQUALIFIED': return 'bg-gray-100 text-gray-800';
    case 'FOLLOW_UP': return 'bg-amber-100 text-amber-800';
    case 'CONVERTED': return 'bg-purple-100 text-purple-800';
    case 'LOST': return 'bg-red-100 text-red-800';
    case 'DORMANT': return 'bg-slate-100 text-slate-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'NEW': return 'Nuevo';
    case 'CONTACTED': return 'Contactado';
    case 'QUALIFIED': return 'Calificado';
    case 'UNQUALIFIED': return 'No Calificado';
    case 'FOLLOW_UP': return 'Seguimiento';
    case 'CONVERTED': return 'Convertido';
    case 'LOST': return 'Perdido';
    case 'DORMANT': return 'Inactivo';
    default: return status;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getSourceLabel = (source: string) => {
  const sourceLabels: { [key: string]: string } = {
    'WEBSITE': 'Sitio Web',
    'REFERRAL': 'Referido',
    'SOCIAL_MEDIA': 'Redes Sociales',
    'EMAIL_CAMPAIGN': 'Campaña Email',
    'PHONE_CALL': 'Llamada Telefónica',
    'EVENT': 'Evento',
    'PARTNER': 'Socio',
    'OTHER': 'Otro'
  };
  return sourceLabels[source] || source;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const api = useApi();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  
  // Auth state - using stable selectors
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);

  const handleLeadCreated = async () => {
    // Reload leads when a new lead is created
    console.log('Lead created, refreshing list...');
    await fetchLeads();
  };

  const handleViewDetails = (lead: Lead) => {
    console.log('Ver detalles de:', lead);
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleEditLead = (lead: Lead) => {
    console.log('Editar prospecto:', lead);
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    console.log('Lead actualizado:', updatedLead);
    // Update the lead in the local state
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id 
          ? updatedLead
          : lead
      )
    );

    // Update the selected lead if it's the same one being viewed
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleCreateOpportunity = async (lead: Lead) => {
    console.log('Convertir a oportunidad:', lead);
    const confirmed = await confirm({
      title: "¿Convertir a oportunidad?",
      description: `¿Deseas convertir a ${lead.firstName} ${lead.lastName} en una oportunidad de negocio? Esto creará automáticamente una cotización asociada.`,
      confirmText: "Convertir",
      cancelText: "Cancelar"
    });
    
    if (confirmed) {
      try {
        // Call API to convert lead to opportunity and create quotation
        const response = await api.post(`/api/leads/${lead.id}/convert-to-opportunity`);
        
        if (!response.ok) {
          throw new Error('Error al convertir el prospecto a oportunidad');
        }
        
        const result = await response.json();
        
        // Update lead status to CONVERTED
        setLeads(prevLeads => 
          prevLeads.map(l => 
            l.id === lead.id 
              ? { ...l, status: 'CONVERTED' as const }
              : l
          )
        );
        
        setShowDetailModal(false);
        
        // Navigate to the opportunities page with the new opportunity
        if (result.data?.opportunityId) {
          router.push(`/opportunities?id=${result.data.opportunityId}`);
        } else {
          router.push('/opportunities');
        }
        
        toast({
          title: "¡Conversión exitosa!",
          description: `Se ha creado la oportunidad y cotización para ${lead.firstName} ${lead.lastName}`,
        });
        
      } catch (error) {
        console.error('Error al convertir prospecto:', error);
        toast({
          title: "Error al convertir prospecto",
          description: "No se pudo convertir el prospecto a oportunidad. Por favor, inténtalo nuevamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleChangeStatus = async (lead: Lead, newStatus: string) => {
    console.log('Cambiar estado:', lead, newStatus);
    try {
      const response = await api.put(`/api/leads/${lead.id}`, {
        status: newStatus
      });

      if (!response.ok) {
        throw new Error('Error al cambiar el estado');
      }

      // Update the lead in the local state
      setLeads(prevLeads => 
        prevLeads.map(l => 
          l.id === lead.id 
            ? { ...l, status: newStatus as any }
            : l
        )
      );

      // Update the selected lead if it's the same one
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      console.log('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error al cambiar estado",
        description: "No se pudo cambiar el estado del prospecto",
        variant: "destructive",
      });
    }
  };

  const handleAssignLead = async (lead: Lead) => {
    console.log('Asignar prospecto:', lead);
    // TODO: Abrir modal para seleccionar usuario del cowork
    toast({
      title: "Funcionalidad próximamente disponible",
      description: "Se abrirá un modal para seleccionar entre admins del cowork y usuarios del cowork (COWORK_USER)",
    });
  };

  const handleCreateActivity = (leadId: string) => {
    console.log('Crear actividad para lead:', leadId);
    // TODO: Abrir modal de crear actividad o navegar a página de actividades
    toast({
      title: "Funcionalidad ya disponible",
      description: "Puedes agregar actividades desde el detalle del prospecto en la pestaña 'Actividad'",
    });
  };

  const handleUpdateScore = async (leadId: string, newScore: number) => {
    console.log('Actualizar puntuación:', leadId, newScore);
    try {
      const response = await api.post(`/api/leads/${leadId}/update-score`, {
        score: newScore
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar la puntuación'}`);
      }

      const result = await response.json();
      console.log('API Success response:', result);

      // Update the lead in the local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, score: newScore }
            : lead
        )
      );

      // Update the selected lead if it's the same one
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, score: newScore } : null);
      }

      console.log('Puntuación actualizada exitosamente');
    } catch (error) {
      console.error('Error completo al actualizar puntuación:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    console.log('Eliminar prospecto:', lead);
    const confirmed = await confirm({
      title: "¿Eliminar prospecto?",
      description: `¿Estás seguro de que deseas eliminar a ${lead.firstName} ${lead.lastName}? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive"
    });
    if (confirmed) {
      try {
        // TODO: Llamar API para eliminar
        const response = await api.delete(`/api/leads/${lead.id}`);
        if (response.ok) {
          toast({
            title: "Prospecto eliminado",
            description: "El prospecto ha sido eliminado exitosamente",
          });
          await fetchLeads(); // Recargar lista
        }
      } catch (error) {
        console.error('Error al eliminar prospecto:', error);
        toast({
          title: "Error al eliminar prospecto",
          description: "No se pudo eliminar el prospecto",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadLeads = async () => {
      console.log('=== LOADING LEADS ===');
      console.log('Auth state:', {
        isAuthenticated,
        hasToken: !!accessToken,
        user: user?.email
      });
      
      // Continue loading even if not authenticated for testing
      // if (!isAuthenticated || !accessToken) {
      //   console.log('User not authenticated, skipping fetch');
      //   setLoading(false);
      //   return;
      // }

      try {
        setLoading(true);
        console.log('Fetching real leads from database. Auth info:', {
          user: user?.email,
          tenantId: user?.tenantId,
          role: user?.role
        });
        
        // Use the authenticated API with user's token
        const response = await api.get('/api/leads');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Error al cargar los prospectos: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        console.log('Data structure:', {
          hasSuccess: !!data.success,
          hasData: !!data.data,
          hasLeads: !!data.data?.leads,
          leadsType: typeof data.data?.leads,
          leadsLength: data.data?.leads?.length
        });
        
        if (mounted) {
          // The backend returns: { success: true, data: { leads: [...] } }
          // So we need to access data.data.leads, not data.leads
          const leadsArray = Array.isArray(data.data?.leads) ? data.data.leads : [];
          setLeads(leadsArray);
          console.log('Leads set in state:', leadsArray.length, 'leads');
          console.log('First lead:', leadsArray[0]);
        }
      } catch (error) {
        console.error('Error fetching real leads:', error);
        if (mounted) {
          setLeads([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLeads();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, accessToken, api, user?.email, user?.tenantId]);

  const fetchLeads = useCallback(async () => {
    // Remove auth check for testing - always try to fetch
    console.log('fetchLeads: Attempting to fetch leads (bypass auth check for testing)');

    try {
      setLoading(true);
      console.log('fetchLeads: Making API call...');
      const response = await api.get('/api/leads');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('fetchLeads API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Error al cargar los prospectos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('fetchLeads: Response data:', data);
      
      // Correct the data structure access
      const leadsArray = Array.isArray(data.data?.leads) ? data.data.leads : [];
      setLeads(leadsArray);
      console.log('fetchLeads: Set leads in state:', leadsArray.length, 'leads');
    } catch (error) {
      console.error('fetchLeads error:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, api]);

  // Filter leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.company || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalFilteredLeads = filteredLeads.length;
  const totalPagesCalculated = Math.ceil(totalFilteredLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Update total pages when filters change
  React.useEffect(() => {
    setTotalPages(totalPagesCalculated);
    setTotalLeads(totalFilteredLeads);
    // Reset to first page if current page is beyond available pages
    if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
      setCurrentPage(1);
    }
  }, [totalFilteredLeads, totalPagesCalculated, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length,
  };

  // Debug logging
  console.log('===== LEADS PAGE RENDER =====');
  console.log('Auth status:', { isAuthenticated, hasUser: !!user, hasToken: !!accessToken });
  console.log('Current leads state:', leads);
  console.log('Stats calculated:', stats);
  console.log('Search term:', searchTerm);
  console.log('Selected status:', selectedStatus);
  console.log('Filtered leads:', filteredLeads);
  console.log('Loading state:', loading);
  console.log('===============================');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prospectos</h1>
            <p className="text-gray-600">Gestiona tus clientes potenciales</p>
          </div>
        </div>
        <div className="mr-4">
          <CreateLeadModal onLeadCreated={handleLeadCreated} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prospectos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calificados</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Lista de Prospectos</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar prospectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Estado
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                    Todos los Estados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("NEW")}>
                    Nuevo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("CONTACTED")}>
                    Contactado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("QUALIFIED")}>
                    Calificado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("UNQUALIFIED")}>
                    No Calificado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("FOLLOW_UP")}>
                    Seguimiento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("CONVERTED")}>
                    Convertido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("LOST")}>
                    Perdido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("DORMANT")}>
                    Inactivo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospecto</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    {loading ? 'Cargando...' : 'No se encontraron prospectos'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.company || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {lead.email && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => window.location.href = `mailto:${lead.email}`}
                          title={`Enviar email a ${lead.email}`}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {lead.phone && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => window.location.href = `tel:${lead.phone}`}
                          title={`Llamar a ${lead.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getSourceLabel(lead.source)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.assignedTo ? (
                      <span className="text-sm">
                        {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                          Editar Prospecto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignLead(lead)}>
                          Asignar Usuario
                        </DropdownMenuItem>
                        
                        {/* Status Change Submenu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <DropdownMenuItem>
                              Cambiar Estado →
                            </DropdownMenuItem>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left">
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'NEW')}>
                              Nuevo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'CONTACTED')}>
                              Contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'QUALIFIED')}>
                              Calificado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'UNQUALIFIED')}>
                              No Calificado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'FOLLOW_UP')}>
                              Seguimiento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'DORMANT')}>
                              Inactivo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'LOST')}>
                              Perdido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteLead(lead)}
                        >
                          Eliminar Prospecto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination */}
        {(totalPages > 1 || totalLeads > itemsPerPage) && (
          <div className="px-6 py-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalLeads}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              showPageSizeSelector={true}
            />
          </div>
        )}
      </Card>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLead(null);
        }}
        onCreateOpportunity={handleCreateOpportunity}
        onUpdateScore={handleUpdateScore}
        onCreateActivity={handleCreateActivity}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={editingLead}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLead(null);
        }}
        onLeadUpdated={handleLeadUpdated}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
}