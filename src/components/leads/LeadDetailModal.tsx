"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateActivityModal from "./CreateActivityModal";
import EditActivityModal from "./EditActivityModal";
import { useActivitiesWithCache } from "@/hooks/use-activities-cache";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";
import { deleteActivity } from "@/lib/actions/activities";
import { useConfirm } from "@/hooks/use-confirm";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Globe,
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
  UserCheck,
  FileText,
  TrendingUp,
  Clock,
  Hash,
  ArrowRight,
  Activity,
  Edit3,
  Save,
  X,
  Plus,
  CheckSquare,
  Users,
  ClipboardList,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";

interface Activity {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'TOUR' | 'FOLLOW_UP' | 'DOCUMENT';
  subject: string;
  description?: string;
  dueDate?: string;
  duration?: number;
  location?: string;
  outcome?: string;
  completedAt?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  channel?: string;
  budget?: number;
  interests?: string[];
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST' | 'DORMANT';
  score: number;
  qualificationNotes?: string;
  createdAt: string;
  lastContactAt?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateOpportunity: (lead: Lead) => void;
  onUpdateScore?: (leadId: string, newScore: number) => void;
  onCreateActivity?: (leadId: string) => void;
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

const formatCurrency = (amount: number) => {
  // Formatear número con separadores de miles usando puntos (formato chileno)
  return new Intl.NumberFormat('es-CL').format(amount);
};

export default function LeadDetailModal({ 
  lead, 
  isOpen, 
  onClose, 
  onCreateOpportunity,
  onUpdateScore,
  onCreateActivity
}: LeadDetailModalProps) {
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScore, setEditScore] = useState(lead?.score || 0);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const { toast } = useToast();
  const api = useApi();
  const { confirm, ConfirmDialog } = useConfirm();
  
  // Fetch activities for this lead with caching
  const { 
    activities, 
    loading: activitiesLoading, 
    refetch: refetchActivities,
    updateActivityInCache,
    addActivityToCache,
    removeActivityFromCache 
  } = useActivitiesWithCache({
    leadId: lead?.id,
    autoFetch: true
  });

  // Use activities from API
  const displayActivities = activities;

  // Update editScore when lead changes
  React.useEffect(() => {
    if (lead) {
      setEditScore(lead.score);
      setIsEditingScore(false); // Reset edit mode when lead changes
    }
  }, [lead?.id, lead?.score]);

  if (!lead) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveScore = async () => {
    if (editScore < 0 || editScore > 100) {
      toast({
        title: "Puntuación inválida",
        description: "La puntuación debe estar entre 0 y 100",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Saving score:', editScore, 'for lead:', lead.id);
      
      // Call parent callback to update via API
      if (onUpdateScore) {
        await onUpdateScore(lead.id, editScore);
      }
      
      setIsEditingScore(false);
      console.log('Score saved successfully');
    } catch (error) {
      console.error('Error updating score in modal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al actualizar puntuación",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditScore(lead.score);
    setIsEditingScore(false);
  };

  const handleCreateActivityClick = () => {
    setShowCreateActivityModal(true);
  };

  const handleActivityCreated = (newActivity?: any) => {
    console.log('Activity created for lead:', lead.id, newActivity);
    
    // Add to cache if activity data is provided, otherwise refetch
    if (newActivity && addActivityToCache) {
      addActivityToCache(newActivity);
    } else {
      // Fallback to refetch if no activity data or cache function
      refetchActivities();
    }
    
    // Call parent callback if provided
    if (onCreateActivity) {
      onCreateActivity(lead.id);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    console.log('Editing activity:', activity);
    setEditingActivity(activity);
    setShowEditActivityModal(true);
  };

  const handleActivityUpdated = (updatedActivity: Activity) => {
    console.log('Activity updated:', updatedActivity);
    
    // Update cache instead of refetching (much faster)
    if (updateActivityInCache) {
      updateActivityInCache(updatedActivity);
    } else {
      // Fallback to refetch if cache update fails
      refetchActivities();
    }
    
    // Close edit modal
    setShowEditActivityModal(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = async (activity: Activity) => {
    const confirmed = await confirm({
      title: "¿Eliminar actividad?",
      description: `¿Estás seguro de que deseas eliminar "${activity.subject}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive"
    });
    
    if (!confirmed) return;

    try {
      console.log('Deleting activity with Server Action:', activity.id);
      
      // Delete using Server Action
      const result = await deleteActivity(activity.id);
      
      console.log('Server Action response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar la actividad');
      }
      
      // Remove from cache instead of refetching (much faster)
      if (removeActivityFromCache) {
        removeActivityFromCache(activity.id);
      } else {
        // Fallback to refetch if cache removal fails
        refetchActivities();
      }
      
      toast({
        title: "¡Actividad eliminada!",
        description: "La actividad ha sido eliminada exitosamente",
      });

    } catch (error) {
      console.error('Error deleting activity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar la actividad';
      toast({
        title: "Error al eliminar actividad",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return Phone;
      case 'EMAIL': return Mail;
      case 'MEETING': return Calendar;
      case 'TASK': return CheckSquare;
      case 'NOTE': return FileText;
      case 'TOUR': return Users;
      case 'FOLLOW_UP': return ArrowRight;
      case 'DOCUMENT': return ClipboardList;
      default: return Activity;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'CALL': return 'Llamada';
      case 'EMAIL': return 'Email';
      case 'MEETING': return 'Reunión';
      case 'TASK': return 'Tarea';
      case 'NOTE': return 'Nota';
      case 'TOUR': return 'Tour/Visita';
      case 'FOLLOW_UP': return 'Seguimiento';
      case 'DOCUMENT': return 'Documento';
      default: return type;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'CALL': return 'bg-blue-100 text-blue-600';
      case 'EMAIL': return 'bg-purple-100 text-purple-600';
      case 'MEETING': return 'bg-green-100 text-green-600';
      case 'TASK': return 'bg-orange-100 text-orange-600';
      case 'NOTE': return 'bg-gray-100 text-gray-600';
      case 'TOUR': return 'bg-indigo-100 text-indigo-600';
      case 'FOLLOW_UP': return 'bg-yellow-100 text-yellow-600';
      case 'DOCUMENT': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {lead.firstName} {lead.lastName}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {lead.position && lead.company ? (
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {lead.position} en {lead.company}
                      </span>
                    ) : lead.company ? (
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {lead.company}
                      </span>
                    ) : (
                      <span className="text-gray-500">Sin empresa registrada</span>
                    )}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusColor(lead.status)}>
                  {getStatusLabel(lead.status)}
                </Badge>
                <div className="flex items-center gap-2">
                  {!isEditingScore ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className={`h-5 w-5 ${getScoreColor(lead.score)}`} />
                        <span className={`font-bold text-lg ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingScore(true);
                          setEditScore(lead.score);
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        title="Editar puntuación"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className={`h-5 w-5 ${getScoreColor(editScore)}`} />
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editScore}
                          onChange={(e) => setEditScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-16 h-7 text-center font-bold"
                        />
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveScore}
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                          title="Guardar puntuación"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Cancelar edición"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-center">
            <Button 
              onClick={() => onCreateOpportunity(lead)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-8"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Convertir a Oportunidad
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="commercial">Información Comercial</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">No registrado</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Source Information */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-600" />
                    Origen del Prospecto
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Fuente</p>
                      <Badge variant="outline" className="text-sm">
                        {getSourceLabel(lead.source)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Canal</p>
                      <p className="font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        {lead.channel || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commercial" className="mt-6 space-y-6">
              {/* Budget and Interests */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    Información Comercial
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Presupuesto Estimado</p>
                      <p className="font-medium text-lg flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {lead.budget ? formatCurrency(lead.budget) : 'No especificado'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Servicios de Interés</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.interests && lead.interests.length > 0 ? (
                          lead.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">No especificado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {lead.qualificationNotes && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                      Notas de Calificación
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {lead.qualificationNotes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6 space-y-6">
              {/* Timeline */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-gray-600" />
                      Línea de Tiempo
                    </h3>
                    <Button
                      onClick={handleCreateActivityClick}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Actividad
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {/* Loading state */}
                    {activitiesLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Cargando actividades...</span>
                      </div>
                    )}

                    {/* Activities */}
                    {!activitiesLoading && displayActivities.map((activity) => {
                      const IconComponent = getActivityTypeIcon(activity.type);
                      const colorClass = getActivityTypeColor(activity.type);
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-3 group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{activity.subject}</p>
                              <Badge variant="outline" className="text-xs">
                                {getActivityTypeLabel(activity.type)}
                              </Badge>
                              {activity.completedAt && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Completada
                                </Badge>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                            )}
                            {activity.outcome && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Resultado:</span> {activity.outcome}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatDate(activity.createdAt)}</span>
                              <span>Por: {activity.user.firstName} {activity.user.lastName}</span>
                              {activity.duration && (
                                <span>Duración: {activity.duration} min</span>
                              )}
                              {activity.location && (
                                <span>📍 {activity.location}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditActivity(activity)}
                              className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-600"
                              title="Editar actividad"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(activity)}
                              className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                              title="Eliminar actividad"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Static timeline items */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Prospecto creado</p>
                        <p className="text-sm text-gray-500">{formatDate(lead.createdAt)}</p>
                      </div>
                    </div>
                    {lead.lastContactAt && (
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Último contacto</p>
                          <p className="text-sm text-gray-500">{formatDate(lead.lastContactAt)}</p>
                        </div>
                      </div>
                    )}
                    {lead.assignedTo && (
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Asignado a</p>
                          <p className="text-sm text-gray-500">
                            {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!activitiesLoading && displayActivities.length === 0 && (
                      <div className="text-center py-6">
                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay actividades registradas</p>
                        <p className="text-xs text-gray-400">Haz clic en "Agregar Actividad" para comenzar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      {/* Create Activity Modal */}
      <CreateActivityModal
        leadId={lead.id}
        isOpen={showCreateActivityModal}
        onClose={() => setShowCreateActivityModal(false)}
        onActivityCreated={handleActivityCreated}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        activity={editingActivity}
        isOpen={showEditActivityModal}
        onClose={() => {
          setShowEditActivityModal(false);
          setEditingActivity(null);
        }}
        onActivityUpdated={handleActivityUpdated}
        updateActivityInCache={updateActivityInCache}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </Dialog>
  );
}