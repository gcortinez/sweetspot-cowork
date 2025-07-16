"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { convertLeadToOpportunity } from "@/lib/actions/opportunities";
import { STAGE_METADATA, type PipelineStage } from "@/lib/validations/opportunities";
import { 
  TrendingUp, 
  User, 
  Mail, 
  Building2, 
  DollarSign,
  Calendar,
  Target,
  Star,
  Loader2,
  X
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
  budget?: number;
  interests?: string[];
  score: number;
}

interface ConvertToOpportunityModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (opportunityId: string) => void;
}

export default function ConvertToOpportunityModal({
  lead,
  isOpen,
  onClose,
  onSuccess
}: ConvertToOpportunityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    probability: '25',
    expectedCloseDate: '',
    stage: 'INITIAL_CONTACT' as PipelineStage,
  });
  const { toast } = useToast();

  // Reset form when lead changes
  React.useEffect(() => {
    if (lead) {
      setFormData({
        title: `Oportunidad - ${lead.firstName} ${lead.lastName}`,
        description: `Oportunidad creada a partir del prospecto: ${lead.firstName} ${lead.lastName}${lead.company ? ` de ${lead.company}` : ''}`,
        value: lead.budget ? lead.budget.toString() : '',
        probability: '25',
        expectedCloseDate: '',
        stage: 'INITIAL_CONTACT',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    try {
      const submitData = {
        leadId: lead.id,
        title: formData.title,
        description: formData.description || undefined,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability),
        expectedCloseDate: formData.expectedCloseDate && formData.expectedCloseDate.trim() ? new Date(formData.expectedCloseDate + 'T12:00:00.000Z').toISOString() : undefined,
        stage: formData.stage,
      };
      
      console.log('Converting lead with data:', submitData);
      
      const result = await convertLeadToOpportunity(submitData);

      if (result.success) {
        toast({
          title: "¡Conversión exitosa!",
          description: "El prospecto ha sido convertido a oportunidad correctamente.",
        });
        onSuccess(result.data.id);
        onClose();
      } else {
        toast({
          title: "Error en la conversión",
          description: result.error || "No se pudo convertir el prospecto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as any;
        const firstIssue = zodError.issues[0];
        toast({
          title: "Error de validación",
          description: `${firstIssue.path.join('.')}: ${firstIssue.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al convertir el prospecto.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Convertir a Oportunidad
          </DialogTitle>
          <DialogDescription>
            Convierte este prospecto en una oportunidad de venta para darle seguimiento en el pipeline comercial.
          </DialogDescription>
        </DialogHeader>

        {/* Lead Summary */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <User className="h-5 w-5" />
              Información del Prospecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <span className="font-medium">{lead.firstName} {lead.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                <span>{lead.email}</span>
              </div>
              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span>${lead.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Star className="h-4 w-4 text-amber-500" />
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                Score: {lead.score}/100
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                {lead.source}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Título de la Oportunidad *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Oportunidad - Juan Pérez"
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe brevemente esta oportunidad..."
                rows={3}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value" className="text-sm font-medium">
                  Valor Estimado ($) *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="probability" className="text-sm font-medium">
                  Probabilidad (%)
                </Label>
                <Select
                  value={formData.probability}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, probability: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10% - Muy baja</SelectItem>
                    <SelectItem value="25">25% - Baja</SelectItem>
                    <SelectItem value="50">50% - Media</SelectItem>
                    <SelectItem value="75">75% - Alta</SelectItem>
                    <SelectItem value="90">90% - Muy alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage" className="text-sm font-medium">
                  Etapa Inicial
                </Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as PipelineStage }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_METADATA).map(([stage, metadata]) => (
                      <SelectItem key={stage} value={stage}>
                        {metadata.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedCloseDate" className="text-sm font-medium">
                  Fecha Esperada de Cierre
                </Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

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
              disabled={isLoading || !formData.title || !formData.value}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Convertir a Oportunidad
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}