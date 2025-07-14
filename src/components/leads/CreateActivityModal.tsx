"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
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
  Activity
} from "lucide-react";

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'TOUR' | 'FOLLOW_UP' | 'DOCUMENT';

interface CreateActivityModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: (activity?: any) => void;
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
    label: 'Email',
    icon: Mail,
    description: 'Envío de email o comunicación por correo electrónico'
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
    description: 'Tarea pendiente relacionada con el prospecto'
  },
  {
    value: 'NOTE',
    label: 'Nota',
    icon: FileText,
    description: 'Nota o comentario sobre el prospecto'
  },
  {
    value: 'TOUR',
    label: 'Tour/Visita',
    icon: Users,
    description: 'Tour por las instalaciones o visita del prospecto'
  },
  {
    value: 'FOLLOW_UP',
    label: 'Seguimiento',
    icon: ArrowRight,
    description: 'Actividad de seguimiento programada'
  },
  {
    value: 'DOCUMENT',
    label: 'Documento',
    icon: ClipboardList,
    description: 'Envío o recepción de documentos'
  }
];

export default function CreateActivityModal({ 
  leadId, 
  isOpen, 
  onClose, 
  onActivityCreated 
}: CreateActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: '' as ActivityType,
    subject: '',
    description: '',
    dueDate: '',
    duration: '',
    location: '',
    outcome: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const activityData = {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || undefined,
        leadId: leadId,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        location: formData.location || undefined,
        outcome: formData.outcome || undefined
      };

      console.log('Creating activity:', activityData);
      
      // Call API to create activity
      const response = await api.post('/api/activities', activityData);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || 'Error al crear la actividad'}`);
      }
      
      const result = await response.json();
      console.log('Activity created successfully:', result);
      
      // Pass the created activity to the parent
      if (typeof onActivityCreated === 'function') {
        onActivityCreated(result.data || result);
      }
      onClose();
      
      // Reset form
      setFormData({
        type: '' as ActivityType,
        subject: '',
        description: '',
        dueDate: '',
        duration: '',
        location: '',
        outcome: ''
      });
      
      toast({
        title: "¡Actividad creada exitosamente!",
        description: `Se ha registrado la actividad "${formData.subject}" para este prospecto.`,
      });
      
    } catch (error) {
      console.error('Error creating activity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la actividad';
      toast({
        title: "Error al crear actividad",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedActivityType = activityTypes.find(type => type.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Agregar Actividad
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Registra una nueva actividad relacionada con este prospecto
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="type">Tipo de Actividad *</Label>
            <Select value={formData.type} onValueChange={(value: ActivityType) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedActivityType && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <selectedActivityType.icon className="h-4 w-4" />
                {selectedActivityType.description}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Ej: Llamada de seguimiento inicial"
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
              placeholder="Detalles adicionales sobre la actividad..."
              rows={3}
            />
          </div>

          {/* Date and Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha y Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="30"
              />
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
                placeholder="Oficina, Zoom, Teléfono, etc."
                className="pl-10"
              />
            </div>
          </div>

          {/* Outcome (for completed activities) */}
          {(formData.type === 'CALL' || formData.type === 'MEETING' || formData.type === 'EMAIL') && (
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
          )}

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
              disabled={isLoading || !formData.type || !formData.subject}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Creando...' : 'Crear Actividad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}