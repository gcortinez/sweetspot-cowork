"use client";

import React, { useState, useEffect } from 'react';
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Globe,
  Hash,
  MessageSquare,
  Save,
  X,
  Edit3
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

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const sources = [
  'WEBSITE',
  'REFERRAL',
  'SOCIAL_MEDIA',
  'EMAIL_CAMPAIGN',
  'PHONE_CALL',
  'EVENT',
  'PARTNER',
  'OTHER'
];

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

export default function EditLeadModal({ 
  lead, 
  isOpen, 
  onClose, 
  onLeadUpdated 
}: EditLeadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    channel: '',
    budget: '',
    interests: '',
    qualificationNotes: ''
  });

  // Reset form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        position: lead.position || '',
        source: lead.source || '',
        channel: lead.channel || '',
        budget: lead.budget?.toString() || '',
        interests: lead.interests?.join(', ') || '',
        qualificationNotes: lead.qualificationNotes || ''
      });
    }
  }, [lead]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    try {
      // Prepare the data for the API
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        position: formData.position.trim() || undefined,
        source: formData.source,
        channel: formData.channel.trim() || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        interests: formData.interests 
          ? formData.interests.split(',').map(i => i.trim()).filter(i => i.length > 0)
          : [],
        qualificationNotes: formData.qualificationNotes.trim() || undefined
      };

      // Make API call to update lead
      console.log('Updating lead:', lead.id, updateData);
      
      const response = await api.put(`/api/leads/${lead.id}`, updateData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar el prospecto'}`);
      }

      const result = await response.json();
      console.log('API Success response:', result);

      // Use the updated lead from the API response
      const updatedLead: Lead = result.data || {
        ...lead,
        ...updateData
      };

      onLeadUpdated(updatedLead);
      onClose();
      
      // Show success message
      toast({
        title: "¡Prospecto actualizado!",
        description: "Los datos del prospecto han sido actualizados exitosamente",
      });
      
    } catch (error) {
      console.error('Error updating lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar el prospecto';
      toast({
        title: "Error al actualizar prospecto",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              Editar Prospecto
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Actualiza la información del prospecto {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Información Personal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-600" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              Información Profesional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="CEO, Manager, etc."
                />
              </div>
            </div>
          </div>

          {/* Source Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-600" />
              Información de Origen
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Origen *</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {sourceLabels[source]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Canal</Label>
                <Input
                  id="channel"
                  value={formData.channel}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                  placeholder="Facebook, Google Ads, etc."
                />
              </div>
            </div>
          </div>

          {/* Commercial Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5 text-gray-600" />
              Información Comercial
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto Estimado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="1.000.000"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Servicios de Interés</Label>
                <Input
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  placeholder="Oficina privada, Sala de reuniones..."
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              Notas de Calificación
            </h3>
            <div className="space-y-2">
              <Label htmlFor="qualificationNotes">Notas</Label>
              <Textarea
                id="qualificationNotes"
                value={formData.qualificationNotes}
                onChange={(e) => handleInputChange('qualificationNotes', e.target.value)}
                placeholder="Notas sobre el prospecto, necesidades, comentarios..."
                rows={4}
              />
            </div>
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