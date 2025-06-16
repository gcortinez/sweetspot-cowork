"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Plus
} from "lucide-react";

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
  // Formatear número con separadores de miles usando puntos
  return new Intl.NumberFormat('de-DE').format(amount);
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
      alert('La puntuación debe estar entre 0 y 100');
      return;
    }
    
    if (onUpdateScore) {
      try {
        console.log('Saving score:', editScore, 'for lead:', lead.id);
        await onUpdateScore(lead.id, editScore);
        setIsEditingScore(false);
        console.log('Score saved successfully');
      } catch (error) {
        console.error('Error updating score in modal:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert(`Error al actualizar la puntuación: ${errorMessage}`);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditScore(lead.score);
    setIsEditingScore(false);
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
                      onClick={() => onCreateActivity && onCreateActivity(lead.id)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Actividad
                    </Button>
                  </div>
                  <div className="space-y-4">
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}