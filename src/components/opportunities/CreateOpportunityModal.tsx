"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Loader2, 
  Target,
  DollarSign,
  Calendar,
  User,
  Building2,
  MessageSquare,
  Sparkles,
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  createOpportunity,
  type CreateOpportunityInput 
} from "@/lib/actions/opportunities";
import { STAGE_METADATA } from "@/lib/validations/opportunities";
import ClientSelector from "@/components/clients/ClientSelector";

interface CreateOpportunityModalProps {
  onOpportunityCreated?: () => void;
  leadId?: string;
  leadName?: string;
}

interface CreateOpportunityForm {
  title: string;
  description: string;
  value: string;
  probability: string;
  stage: keyof typeof STAGE_METADATA;
  expectedCloseDate: string;
  clientId: string;
  leadId: string;
  assignedToId: string;
  competitorInfo: string;
}

const initialFormData: CreateOpportunityForm = {
  title: '',
  description: '',
  value: '',
  probability: '25',
  stage: 'INITIAL_CONTACT',
  expectedCloseDate: '',
  clientId: '',
  leadId: '',
  assignedToId: '',
  competitorInfo: '',
};

export default function CreateOpportunityModal({ 
  onOpportunityCreated, 
  leadId,
  leadName 
}: CreateOpportunityModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOpportunityForm>(initialFormData);
  const { toast } = useToast();

  // Set lead data when modal opens with a specific lead
  useEffect(() => {
    if (leadId && isOpen) {
      setFormData(prev => ({
        ...prev,
        leadId,
        title: leadName ? `Oportunidad - ${leadName}` : prev.title
      }));
    }
  }, [leadId, leadName, isOpen]);

  const handleInputChange = (field: keyof CreateOpportunityForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.clientId) {
      toast({
        title: "Cliente requerido",
        description: "Debes seleccionar un cliente para crear la oportunidad.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Prepare data for Server Action
      const opportunityData: CreateOpportunityInput = {
        title: formData.title,
        description: formData.description || undefined,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        clientId: formData.clientId || undefined,
        leadId: formData.leadId || undefined,
        assignedToId: formData.assignedToId || undefined,
        competitorInfo: formData.competitorInfo || undefined,
      };

      const result = await createOpportunity(opportunityData);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la oportunidad');
      }

      toast({
        title: "Oportunidad creada exitosamente",
        description: `${formData.title} ha sido agregada al pipeline.`,
      });

      // Reset form and close modal
      setFormData(initialFormData);
      setIsOpen(false);
      
      // Notify parent component
      if (onOpportunityCreated) {
        onOpportunityCreated();
      }

    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: "Error al crear oportunidad",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(leadId ? { ...initialFormData, leadId, title: leadName ? `Oportunidad - ${leadName}` : '' } : initialFormData);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md">
          <Plus className="h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center shadow-purple">
                <Target className="h-5 w-5 text-white" />
              </div>
              Crear Nueva Oportunidad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {leadId ? 
                `Convertir prospecto "${leadName}" en una oportunidad de negocio.` :
                'Completa la información de la nueva oportunidad. Los campos marcados con * son obligatorios.'
              }
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="h-4 w-4 text-brand-purple" />
              <span>Información Básica</span>
            </div>
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Título de la Oportunidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Implementación Oficina Privada - Empresa ABC"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe los detalles de la oportunidad, requisitos específicos, etc..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-success" />
              <span>Información Financiera</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
              <div className="space-y-2">
                <Label htmlFor="value" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Valor de la Oportunidad (COP) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    placeholder="2500000"
                    className="pl-10 h-11"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability" className="text-sm font-medium text-foreground">
                  Probabilidad de Cierre (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="probability"
                    type="number"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    placeholder="25"
                    className="pl-10 h-11"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gestión del Pipeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-brand-purple" />
              <span>Gestión del Pipeline</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="stage" className="text-sm font-medium text-foreground">
                  Etapa Inicial
                </Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    {Object.entries(STAGE_METADATA).map(([stage, metadata]) => (
                      <SelectItem key={stage} value={stage}>
                        {metadata.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate" className="text-sm font-medium text-foreground">
                  Fecha de Cierre Esperada
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Asignación y Relaciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-brand-blue" />
              <span>Asignación y Relaciones</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="assignedToId" className="text-sm font-medium text-foreground">
                  Asignado a
                </Label>
                <Input
                  id="assignedToId"
                  value={formData.assignedToId}
                  onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                  placeholder="ID del usuario asignado"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Si se deja vacío, se asignará al usuario actual
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Cliente Asociado <span className="text-destructive">*</span>
                </Label>
                <ClientSelector
                  value={formData.clientId}
                  onValueChange={(clientId) => handleInputChange('clientId', clientId || '')}
                  placeholder="Seleccionar cliente..."
                  allowCreate={true}
                  required={true}
                />
                <p className="text-xs text-muted-foreground">
                  Selecciona el cliente al que pertenece esta oportunidad
                </p>
              </div>
            </div>
          </div>

          {/* Información Competitiva */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-brand-blue" />
              <span>Información Adicional</span>
            </div>
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="competitorInfo" className="text-sm font-medium text-foreground">
                  Información de Competidores
                </Label>
                <Textarea
                  id="competitorInfo"
                  value={formData.competitorInfo}
                  onChange={(e) => handleInputChange('competitorInfo', e.target.value)}
                  placeholder="¿Qué sabes sobre la competencia? ¿Hay otros proveedores considerados?"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Campos obligatorios
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[140px] bg-gradient-to-r from-brand-purple to-purple-700 hover:from-brand-purple/90 hover:to-purple-700/90 shadow-purple hover-lift"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Oportunidad
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}