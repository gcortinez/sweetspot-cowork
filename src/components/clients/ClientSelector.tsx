"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Building2, 
  Search, 
  Plus, 
  Check, 
  ChevronsUpDown,
  User,
  Mail,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  searchClients,
  createClient,
  type CreateClientInput
} from "@/lib/actions/clients";
import { 
  CLIENT_STATUS_METADATA,
  type ClientStatus
} from "@/lib/validations/clients";
import CreateClientModal from './CreateClientModal';

interface ClientOption {
  id: string;
  name: string;
  email: string;
  status: ClientStatus;
  contactPerson?: string;
}

interface ClientSelectorProps {
  value?: string;
  onValueChange: (clientId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  allowCreate?: boolean;
}

export default function ClientSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar cliente...",
  className,
  disabled = false,
  required = false,
  allowCreate = true
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  // Load initial clients and search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchClientsDebounced(searchQuery);
    } else if (searchQuery.length === 0) {
      // Load some default clients when no search query
      searchClientsDebounced('');
    }
  }, [searchQuery]);

  // Find selected client when value changes
  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find(c => c.id === value);
      if (client) {
        setSelectedClient(client);
      }
    } else if (!value) {
      setSelectedClient(null);
    }
  }, [value, clients]);

  const searchClientsDebounced = async (query: string) => {
    setIsSearching(true);
    try {
      const result = await searchClients({ 
        query: query || 'a', // Use 'a' as default to get some results
        limit: 20 
      });
      
      if (result.success) {
        setClients(result.data);
      } else {
        console.error('Error searching clients:', result.error);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientSelect = (client: ClientOption) => {
    setSelectedClient(client);
    onValueChange(client.id);
    setOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    onValueChange(undefined);
  };

  const handleCreateClient = () => {
    setShowCreateModal(true);
    setOpen(false);
  };

  const handleClientCreated = () => {
    // Refresh the clients list
    if (searchQuery) {
      searchClientsDebounced(searchQuery);
    } else {
      searchClientsDebounced('');
    }
    setShowCreateModal(false);
    
    toast({
      title: "Cliente creado",
      description: "El cliente ha sido creado exitosamente.",
    });
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
    <>
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between h-11",
                  !selectedClient && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                {selectedClient ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="h-4 w-4 text-brand-purple flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{selectedClient.name}</div>
                    </div>
                    <Badge className={`${getStatusColor(selectedClient.status)} border text-xs`}>
                      {CLIENT_STATUS_METADATA[selectedClient.status].label}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{placeholder}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {selectedClient && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelection();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 z-[60]" align="start">
              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <Search className="h-4 w-4 animate-spin" />
                      <span>Buscando...</span>
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="py-4 text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        No se encontraron clientes.
                      </div>
                      {allowCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleCreateClient}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear nuevo cliente
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                            "hover:bg-muted",
                            selectedClient?.id === client.id && "bg-muted"
                          )}
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{client.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {client.email}
                            </div>
                            {client.contactPerson && (
                              <div className="text-xs text-muted-foreground truncate">
                                {client.contactPerson}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`${getStatusColor(client.status)} border text-xs`}>
                              {CLIENT_STATUS_METADATA[client.status].label}
                            </Badge>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                      
                      {allowCreate && (
                        <div className="border-t pt-2 mt-2">
                          <div
                            onClick={handleCreateClient}
                            className="flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors hover:bg-muted"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear nuevo cliente</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {selectedClient && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{selectedClient.email}</span>
            </div>
            {selectedClient.contactPerson && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{selectedClient.contactPerson}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClientCreated={handleClientCreated}
        />
      )}
    </>
  );
}