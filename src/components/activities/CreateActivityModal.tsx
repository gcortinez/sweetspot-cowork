"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createActivity } from "@/lib/actions/activities";
import { 
  Phone, 
  Mail, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Users, 
  ArrowRight, 
  ClipboardList,
  Save,
  X,
  Clock,
  MapPin,
  Activity,
  Loader2
} from "lucide-react";

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'TOUR' | 'FOLLOW_UP' | 'DOCUMENT';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: (activity?: any) => void;
  // Either leadId or opportunityId should be provided
  leadId?: string;
  opportunityId?: string;
  clientId?: string;
}

const activityTypes: Array<{
  value: ActivityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: 'CALL',
    label: 'Llamada Telefónica',
    icon: Phone,
    description: 'Registrar una llamada realizada o programar una futura'
  },
  {
    value: 'EMAIL',
    label: 'Correo Electrónico',
    icon: Mail,
    description: 'Registrar comunicación por email'
  },
  {
    value: 'MEETING',
    label: 'Reunión',
    icon: Users,
    description: 'Reunión presencial o virtual'
  },
  {
    value: 'TASK',
    label: 'Tarea',
    icon: CheckSquare,
    description: 'Tarea pendiente o completada'
  },
  {
    value: 'NOTE',
    label: 'Nota',
    icon: FileText,
    description: 'Nota o comentario importante'
  },
  {
    value: 'TOUR',
    label: 'Tour / Visita',
    icon: MapPin,
    description: 'Tour de las instalaciones o visita programada'
  },
  {
    value: 'FOLLOW_UP',
    label: 'Seguimiento',
    icon: ArrowRight,
    description: 'Actividad de seguimiento'
  },
  {
    value: 'DOCUMENT',
    label: 'Documento',
    icon: ClipboardList,
    description: 'Envío o recepción de documentos'
  }
];

export default function CreateActivityModal({
  isOpen,
  onClose,
  onActivityCreated,
  leadId,
  opportunityId,
  clientId
}: CreateActivityModalProps) {
  const [formData, setFormData] = useState({
    type: '' as ActivityType,
    subject: '',
    description: '',
    dueDate: '',
    duration: '',
    location: '',
    outcome: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      type: '' as ActivityType,
      subject: '',
      description: '',
      dueDate: '',
      duration: '',
      location: '',
      outcome: ''
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.subject) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el tipo y asunto de la actividad.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const activityData = {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        location: formData.location || undefined,
        outcome: formData.outcome || undefined,
        leadId,
        opportunityId,
        clientId,
      };

      const result = await createActivity(activityData);
      
      if (result.success) {
        toast({
          title: "¡Actividad creada!",
          description: "La actividad ha sido registrada exitosamente.",
          variant: "success",
        });
        
        onActivityCreated(result.data);
        handleClose();
      } else {
        toast({
          title: "Error al crear actividad",
          description: result.error || "No se pudo crear la actividad.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al crear la actividad.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityName = () => {
    if (leadId) return "prospecto";
    if (opportunityId) return "oportunidad";
    if (clientId) return "cliente";
    return "entidad";
  };

  const selectedActivityType = activityTypes.find(type => type.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Nueva Actividad
          </DialogTitle>
          <DialogDescription>
            Registra una nueva actividad para este {getEntityName()}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo de Actividad *
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ActivityType }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Asunto *
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Describe brevemente la actividad"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales de la actividad..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Additional Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Fecha y Hora
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duración (minutos)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="ej: 30"
                min="1"
                disabled={isLoading}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Ubicación
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Lugar de la actividad"
                disabled={isLoading}
              />
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label htmlFor="outcome" className="text-sm font-medium">
                Resultado
              </Label>
              <Input
                id="outcome"
                value={formData.outcome}
                onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                placeholder="Resultado de la actividad"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Activity Type Info */}
          {selectedActivityType && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <selectedActivityType.icon className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">{selectedActivityType.label}</span>
              </div>
              <p className="text-sm text-purple-700">{selectedActivityType.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.type || !formData.subject}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Actividad
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}