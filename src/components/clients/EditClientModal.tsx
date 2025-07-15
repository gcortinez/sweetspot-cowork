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
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  AlertCircle,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  updateClient,
  type UpdateClientInput 
} from "@/lib/actions/clients";
import { 
  CLIENT_STATUS, 
  CLIENT_STATUS_METADATA,
  type ClientStatus,
  type ClientWithRelations
} from "@/lib/validations/clients";

interface EditClientModalProps {
  client: ClientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated?: () => void;
}

interface EditClientForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  contactPerson: string;
  status: ClientStatus;
  notes: string;
}

export default function EditClientModal({ 
  client,
  isOpen,
  onClose,
  onClientUpdated
}: EditClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EditClientForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    contactPerson: '',
    status: 'LEAD',
    notes: '',
  });
  const { toast } = useToast();

  // Load client data when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        taxId: client.taxId || '',
        contactPerson: client.contactPerson || '',
        status: client.status,
        notes: client.notes || '',
      });
    }
  }, [isOpen, client]);

  const handleInputChange = (field: keyof EditClientForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for Server Action
      const updateData: UpdateClientInput = {};
      
      // Only include changed fields
      if (formData.name !== client.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== client.email) {
        updateData.email = formData.email;
      }
      if (formData.phone !== (client.phone || '')) {
        updateData.phone = formData.phone || undefined;
      }
      if (formData.address !== (client.address || '')) {
        updateData.address = formData.address || undefined;
      }
      if (formData.taxId !== (client.taxId || '')) {
        updateData.taxId = formData.taxId || undefined;
      }
      if (formData.contactPerson !== (client.contactPerson || '')) {
        updateData.contactPerson = formData.contactPerson || undefined;
      }
      if (formData.status !== client.status) {
        updateData.status = formData.status;
      }
      if (formData.notes !== (client.notes || '')) {
        updateData.notes = formData.notes || undefined;
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

      const result = await updateClient(client.id, updateData);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar el cliente');
      }

      toast({
        title: "Cliente actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });

      onClose();
      
      // Notify parent component
      if (onClientUpdated) {
        onClientUpdated();
      }

    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ClientStatus) => {
    const colors = {
      blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300',
      indigo: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300',
      green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300',
      yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300',
      red: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300',
    };
    return colors[CLIENT_STATUS_METADATA[status].color as keyof typeof colors] || colors.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center shadow-brand">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Editar Cliente
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Actualiza la información del cliente "{client.name}".
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-brand-blue" />
              <span>Información Básica</span>
            </div>
            <div className="space-y-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1 text-foreground">
                    Nombre de la Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Empresa ABC S.A.S"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1 text-foreground">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Teléfono
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-sm font-medium text-foreground">
                    Persona de Contacto
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Juan Pérez"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Dirección
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Calle 123 #45-67, Bogotá, Colombia"
                    className="pl-10 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Fiscal y Estado */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-brand-blue" />
              <span>Información Fiscal y Estado</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-sm font-medium text-foreground">
                  NIT / RUT
                </Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="900.123.456-7"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-foreground">
                  Estado del Cliente
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    {Object.entries(CLIENT_STATUS_METADATA).map(([status, metadata]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status as ClientStatus).includes('blue') ? 'bg-blue-500' : 
                            getStatusColor(status as ClientStatus).includes('indigo') ? 'bg-indigo-500' :
                            getStatusColor(status as ClientStatus).includes('green') ? 'bg-green-500' :
                            getStatusColor(status as ClientStatus).includes('yellow') ? 'bg-yellow-500' :
                            'bg-red-500'}`}></div>
                          <span>{metadata.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertCircle className="h-4 w-4 text-brand-purple" />
              <span>Notas Adicionales</span>
            </div>
            <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el cliente..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Client Stats */}
          {client._count && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertCircle className="h-4 w-4 text-brand-green" />
                <span>Estadísticas del Cliente</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{client._count.opportunities}</div>
                  <div className="text-sm text-muted-foreground">Oportunidades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{client._count.leads || 0}</div>
                  <div className="text-sm text-muted-foreground">Prospectos</div>
                </div>
              </div>
            </div>
          )}

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