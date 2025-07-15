"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";
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
  MapPin
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

interface EditActivityModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onActivityUpdated: (activity: Activity) => void;
  updateActivityInCache?: (activity: Activity) => void;
}

const activityTypes: Array<{
  value: Activity['type'];
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
    description: 'Envío de email o seguimiento de correspondencia'
  },
  {
    value: 'MEETING',
    label: 'Reunión',
    icon: Calendar,
    description: 'Reunión presencial o virtual con el prospecto'
  },
  {
    value: 'TASK',
    label: 'Tarea',
    icon: CheckSquare,
    description: 'Tarea o acción específica relacionada al prospecto'
  },
  {
    value: 'NOTE',
    label: 'Nota',
    icon: FileText,
    description: 'Nota o comentario importante sobre el prospecto'
  },
  {
    value: 'TOUR',
    label: 'Tour/Visita',
    icon: Users,
    description: 'Tour de las instalaciones o visita del prospecto'
  },
  {
    value: 'FOLLOW_UP',
    label: 'Seguimiento',
    icon: ArrowRight,
    description: 'Seguimiento programado o recordatorio'
  },
  {
    value: 'DOCUMENT',
    label: 'Documento',
    icon: ClipboardList,
    description: 'Envío o revisión de documentos y propuestas'
  }
];

export default function EditActivityModal({ 
  activity, 
  isOpen, 
  onClose, 
  onActivityUpdated,
  updateActivityInCache
}: EditActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: 'CALL' as Activity['type'],
    subject: '',
    description: '',
    dueDate: '',
    duration: '',
    location: '',
    outcome: '',
    isCompleted: false
  });

  // Reset form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type,
        subject: activity.subject,
        description: activity.description || '',
        dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : '',
        duration: activity.duration?.toString() || '',
        location: activity.location || '',
        outcome: activity.outcome || '',
        isCompleted: !!activity.completedAt
      });
    }
  }, [activity]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || isLoading) return;

    console.log('Starting activity update, setting isLoading to true');
    setIsLoading(true);
    
    try {
      // Prepare the data for the API
      const updateData: any = {
        type: formData.type,
        subject: formData.subject.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        location: formData.location.trim() || undefined,
        outcome: formData.outcome.trim() || undefined,
      };

      // Handle completion status
      if (formData.isCompleted && !activity.completedAt) {
        updateData.completedAt = new Date().toISOString();
      } else if (!formData.isCompleted && activity.completedAt) {
        updateData.completedAt = null;
      }

      // Update activity via API - use v1 endpoint directly for better performance
      console.log('Updating activity:', activity.id, updateData);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('La solicitud tardó demasiado tiempo')), 30000);
      });
      
      // Race between the API call and timeout
      const response = await Promise.race([
        api.put(`/api/activities/${activity.id}`, updateData),
        timeoutPromise
      ]) as Response;
      
      console.log('Response received:', response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar la actividad'}`);
      }
      
      let result;
      try {
        result = await response.json();
        console.log('Activity updated successfully:', result);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Error al procesar la respuesta del servidor');
      }
      
      const updatedActivity = result.data || result;

      // Update cache if available (faster than refetching)
      if (updateActivityInCache) {
        updateActivityInCache(updatedActivity);
      }
      
      onActivityUpdated(updatedActivity);
      
      // Show success message
      toast({
        title: "¡Actividad actualizada!",
        description: "La actividad ha sido actualizada exitosamente",
      });
      
      // Close modal after successful update
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 100);
      
    } catch (error) {
      console.error('Error updating activity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar la actividad';
      toast({
        title: "Error al actualizar actividad",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('Activity update finished, setting isLoading to false');
      setIsLoading(false);
    }
  };

  if (!activity) return null;

  const selectedType = activityTypes.find(type => type.value === formData.type);
  const IconComponent = selectedType?.icon || FileText;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              Editar Actividad
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Modifica los detalles de la actividad
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Actividad *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Título o asunto de la actividad"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe los detalles de la actividad..."
              rows={3}
            />
          </div>

          {/* Due Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha y Hora</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="30"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Sala de reuniones, oficina, etc."
                className="pl-10"
              />
            </div>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Resultado</Label>
            <Textarea
              id="outcome"
              value={formData.outcome}
              onChange={(e) => handleInputChange('outcome', e.target.value)}
              placeholder="¿Cuál fue el resultado de esta actividad?"
              rows={2}
            />
          </div>

          {/* Completed Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="completed"
              checked={formData.isCompleted}
              onCheckedChange={(value) => handleInputChange('isCompleted', value)}
            />
            <Label htmlFor="completed">Marcar como completada</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}