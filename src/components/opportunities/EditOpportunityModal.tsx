"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Target,
  DollarSign,
  Calendar,
  User,
  Building2,
  MessageSquare,
  Edit,
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  updateOpportunity,
  type UpdateOpportunityInput 
} from "@/lib/actions/opportunities";
import { STAGE_METADATA } from "@/lib/validations/opportunities";
import ClientSelector from "@/components/clients/ClientSelector";

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  stage: keyof typeof STAGE_METADATA;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  competitorInfo?: string;
  assignedToId?: string;
  clientId?: string;
  lostReason?: string;
}

interface EditOpportunityModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onOpportunityUpdated?: () => void;
}

interface EditOpportunityForm {
  title: string;
  description: string;
  value: string;
  probability: string;
  stage: keyof typeof STAGE_METADATA;
  expectedCloseDate: string;
  actualCloseDate: string;
  clientId: string;
  assignedToId: string;
  competitorInfo: string;
  lostReason: string;
}

export default function EditOpportunityModal({ 
  opportunity,
  isOpen,
  onClose,
  onOpportunityUpdated
}: EditOpportunityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EditOpportunityForm>({
    title: '',
    description: '',
    value: '',
    probability: '',
    stage: 'INITIAL_CONTACT',
    expectedCloseDate: '',
    actualCloseDate: '',
    clientId: '',
    assignedToId: '',
    competitorInfo: '',
    lostReason: '',
  });
  const { toast } = useToast();

  // Load opportunity data when modal opens
  useEffect(() => {
    if (isOpen && opportunity) {
      setFormData({
        title: opportunity.title,
        description: opportunity.description || '',
        value: opportunity.value.toString(),
        probability: opportunity.probability.toString(),
        stage: opportunity.stage,
        expectedCloseDate: opportunity.expectedCloseDate 
          ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0] 
          : '',
        actualCloseDate: opportunity.actualCloseDate 
          ? new Date(opportunity.actualCloseDate).toISOString().split('T')[0] 
          : '',
        clientId: opportunity.clientId || '',
        assignedToId: opportunity.assignedToId || '',
        competitorInfo: opportunity.competitorInfo || '',
        lostReason: opportunity.lostReason || '',
      });
    }
  }, [isOpen, opportunity]);

  const handleInputChange = (field: keyof EditOpportunityForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for Server Action
      const updateData: UpdateOpportunityInput = {};
      
      // Only include changed fields
      if (formData.title !== opportunity.title) {
        updateData.title = formData.title;
      }
      if (formData.description !== (opportunity.description || '')) {
        updateData.description = formData.description || undefined;
      }
      if (parseFloat(formData.value) !== opportunity.value) {
        updateData.value = parseFloat(formData.value);
      }
      if (parseInt(formData.probability) !== opportunity.probability) {
        updateData.probability = parseInt(formData.probability);
      }
      if (formData.stage !== opportunity.stage) {
        updateData.stage = formData.stage;
      }
      
      const expectedDate = formData.expectedCloseDate || undefined;
      const originalExpectedDate = opportunity.expectedCloseDate 
        ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0] 
        : undefined;
      if (expectedDate !== originalExpectedDate) {
        updateData.expectedCloseDate = expectedDate ? new Date(expectedDate).toISOString() : undefined;
      }

      const actualDate = formData.actualCloseDate || undefined;
      const originalActualDate = opportunity.actualCloseDate 
        ? new Date(opportunity.actualCloseDate).toISOString().split('T')[0] 
        : undefined;
      if (actualDate !== originalActualDate) {
        updateData.actualCloseDate = actualDate ? new Date(actualDate).toISOString() : undefined;
      }

      if (formData.competitorInfo !== (opportunity.competitorInfo || '')) {
        updateData.competitorInfo = formData.competitorInfo || undefined;
      }
      if (formData.assignedToId !== (opportunity.assignedToId || '')) {
        updateData.assignedToId = formData.assignedToId || undefined;
      }
      if (formData.clientId !== (opportunity.clientId || '')) {
        updateData.clientId = formData.clientId || undefined;
      }
      if (formData.lostReason !== (opportunity.lostReason || '')) {
        updateData.lostReason = formData.lostReason || undefined;
      }

      // Only proceed if there are changes
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se detectaron cambios para guardar.",
        });
        onClose();
        return;
      }

      const result = await updateOpportunity(opportunity.id, updateData);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar la oportunidad');
      }

      toast({
        title: "Oportunidad actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      });

      onClose();
      
      // Notify parent component
      if (onOpportunityUpdated) {
        onOpportunityUpdated();
      }

    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isClosedStage = formData.stage === 'CLOSED_WON' || formData.stage === 'CLOSED_LOST';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center shadow-brand">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Editar Oportunidad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Actualiza la información de la oportunidad "{opportunity.title}".
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="h-4 w-4 text-brand-blue" />
              <span>Información Básica</span>
            </div>
            <div className="space-y-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
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
              <Target className="h-4 w-4 text-brand-purple" />
              <span>Gestión del Pipeline</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="stage" className="text-sm font-medium text-foreground">
                  Etapa
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

          {/* Fechas de Cierre y Razón de Pérdida */}
          {isClosedStage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calendar className="h-4 w-4 text-brand-blue" />
                <span>Información de Cierre</span>
              </div>
              <div className="space-y-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="actualCloseDate" className="text-sm font-medium text-foreground">
                    Fecha de Cierre Real
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="actualCloseDate"
                      type="date"
                      value={formData.actualCloseDate}
                      onChange={(e) => handleInputChange('actualCloseDate', e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                {formData.stage === 'CLOSED_LOST' && (
                  <div className="space-y-2">
                    <Label htmlFor="lostReason" className="text-sm font-medium text-foreground">
                      Razón de Pérdida
                    </Label>
                    <Textarea
                      id="lostReason"
                      value={formData.lostReason}
                      onChange={(e) => handleInputChange('lostReason', e.target.value)}
                      placeholder="¿Por qué se perdió esta oportunidad? (precio, timing, competencia, etc.)"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Asignación y Cliente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-brand-blue" />
              <span>Asignación y Cliente</span>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-sm font-medium text-foreground">
                  Cliente Asociado
                </Label>
                <ClientSelector
                  value={formData.clientId}
                  onValueChange={(clientId) => handleInputChange('clientId', clientId || '')}
                  placeholder="Seleccionar cliente..."
                  allowCreate={true}
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
              <Building2 className="h-4 w-4 text-brand-purple" />
              <span>Información Competitiva</span>
            </div>
            <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
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
                onClick={onClose}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[140px] bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90 shadow-brand hover-lift"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Guardar Cambios
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