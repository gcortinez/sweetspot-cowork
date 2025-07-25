"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Globe, 
  Hash, 
  DollarSign,
  MessageSquare,
  Sparkles,
  Check,
  ChevronsUpDown,
  Search,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";
import { useCreateLead } from "@/hooks/use-clients";

interface CreateLeadModalProps {
  onLeadCreated?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface CreateLeadForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: string;
  channel: string;
  budget: string;
  interests: string;
  qualificationNotes: string;
  assignedToId: string;
  clientId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
}

const initialFormData: CreateLeadForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  source: 'WEBSITE',
  channel: '',
  budget: '',
  interests: '',
  qualificationNotes: '',
  assignedToId: '',
  clientId: '',
};

const sourceOptions = [
  { value: 'WEBSITE', label: 'Sitio Web' },
  { value: 'REFERRAL', label: 'Referencia' },
  { value: 'SOCIAL_MEDIA', label: 'Redes Sociales' },
  { value: 'COLD_CALL', label: 'Llamada en Frío' },
  { value: 'EMAIL_CAMPAIGN', label: 'Campaña de Email' },
  { value: 'WALK_IN', label: 'Visita Directa' },
  { value: 'PARTNER', label: 'Socio' },
  { value: 'OTHER', label: 'Otro' },
];

export default function CreateLeadModal({ onLeadCreated, isOpen: externalIsOpen, onClose }: CreateLeadModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateLeadForm>(initialFormData);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [createNewClient, setCreateNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const api = useApi();
  
  // State for lazy-loaded clients
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const createLeadMutation = useCreateLead();

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? onClose : setInternalIsOpen;

  // Load clients only when needed (when client search is opened)
  const loadClients = async () => {
    if (clients.length > 0) return; // Already loaded
    
    try {
      setIsLoadingClients(true);
      const response = await api.get('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingClients(false);
    }
  };


  const handleInputChange = (field: keyof CreateLeadForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setShowClientSearch(false);
  };

  const handleCreateNewClient = () => {
    setCreateNewClient(true);
    setSelectedClient(null);
    setFormData(prev => ({ ...prev, clientId: '' }));
    setShowClientSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for API
    const leadData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      position: formData.position || undefined,
      source: formData.source,
      channel: formData.channel || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      interests: formData.interests ? formData.interests.split(',').map(s => s.trim()) : undefined,
      qualificationNotes: formData.qualificationNotes || undefined,
      assignedToId: formData.assignedToId || undefined,
      clientId: formData.clientId || undefined,
      createNewClient: createNewClient,
    };

    createLeadMutation.mutate(leadData, {
      onSuccess: (result) => {
        toast({
          title: "Prospecto creado exitosamente",
          description: `${formData.firstName} ${formData.lastName} ha sido agregado a tus prospectos.`,
        });

        // Reset form and close modal
        resetForm();
        if (onClose) {
          onClose();
        } else {
          setInternalIsOpen(false);
        }
        
        // Notify parent component
        if (onLeadCreated) {
          onLeadCreated();
        }
      },
      onError: (error) => {
        console.error('Error creating lead:', error);
        toast({
          title: "Error al crear prospecto",
          description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
          variant: "destructive",
        });
      }
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedClient(null);
    setCreateNewClient(false);
    setShowClientSearch(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (onClose) {
      if (!open) {
        onClose();
        resetForm();
      }
    } else {
      setInternalIsOpen(open);
      if (!open) resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!onClose && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90 shadow-brand hover-lift">
            <Plus className="h-4 w-4" />
            Agregar Prospecto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center shadow-brand">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Crear Nuevo Prospecto
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Completa la información del nuevo prospecto. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-brand-blue" />
              <span>Información Personal</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Juan"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Pérez"
                  className="h-11"
                  required
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-brand-green" />
              <span>Información de Contacto</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
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
                    placeholder="juan@empresa.com"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Empresarial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-brand-blue" />
              <span>Información Empresarial</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-foreground">
                  Empresa
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Acme Corporation"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-foreground">
                  Cargo
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Director de Operaciones"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cliente Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-brand-green" />
              <span>Información del Cliente</span>
              <Badge variant="secondary" className="text-xs">Opcional</Badge>
            </div>
            <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
              <div className="space-y-4">
                {/* Client Selection */}
                <div className="flex gap-2">
                  <Popover open={showClientSearch} onOpenChange={(open) => {
                    setShowClientSearch(open);
                    if (open) loadClients();
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={showClientSearch}
                        className="flex-1 justify-between"
                      >
                        {selectedClient ? (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-green-600" />
                            {selectedClient.name}
                          </div>
                        ) : (
                          <div className="flex items-center text-muted-foreground">
                            <Search className="h-4 w-4 mr-2" />
                            Buscar cliente existente...
                          </div>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => handleClientSelect(client)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-sm text-muted-foreground">{client.email}</div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {client.status}
                                  </Badge>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateNewClient}
                    className="shrink-0"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Nuevo
                  </Button>
                </div>

                {/* Show client info if selected */}
                {selectedClient && (
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">{selectedClient.name}</p>
                        <p className="text-sm text-green-600">{selectedClient.email}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {selectedClient.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Show create new client option */}
                {createNewClient && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-blue-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Se creará un nuevo cliente con la información de contacto proporcionada
                      </span>
                    </div>
                  </div>
                )}

                {/* Reset button */}
                {(selectedClient || createNewClient) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(null);
                      setCreateNewClient(false);
                      setFormData(prev => ({ ...prev, clientId: '' }));
                    }}
                    className="text-xs"
                  >
                    Limpiar selección
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Origen y Canal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="h-4 w-4 text-brand-purple" />
              <span>Origen del Prospecto</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium flex items-center gap-1 text-foreground">
                  Origen <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel" className="text-sm font-medium text-foreground">
                  Canal específico
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="channel"
                    value={formData.channel}
                    onChange={(e) => handleInputChange('channel', e.target.value)}
                    placeholder="Google Ads, Facebook, LinkedIn..."
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Presupuesto e Intereses */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-success" />
              <span>Información Comercial</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium text-foreground">
                  Presupuesto estimado (CLP)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="500000"
                    className="pl-10 h-11"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests" className="text-sm font-medium text-foreground">
                  Servicios de interés
                </Label>
                <Input
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  placeholder="Coworking, Oficina Privada, Salas..."
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Notas de Calificación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="h-4 w-4 text-brand-blue" />
              <span>Notas Adicionales</span>
            </div>
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200">
              <Textarea
                id="qualificationNotes"
                value={formData.qualificationNotes}
                onChange={(e) => handleInputChange('qualificationNotes', e.target.value)}
                placeholder="Agrega notas importantes sobre este prospecto, necesidades específicas, preferencias de horario, etc..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Estas notas son privadas y solo serán visibles para tu equipo.
              </p>
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
                disabled={createLeadMutation.isPending}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createLeadMutation.isPending}
                className="min-w-[140px] bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90 shadow-brand hover-lift"
              >
                {createLeadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Prospecto
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