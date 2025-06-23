"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Search, 
  Users, 
  Mail, 
  UserCheck,
  Loader2,
  Shield,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/use-api";

interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'CLIENT_ADMIN' | 'END_USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface AssignUserModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUserAssigned: (lead: Lead, user: User) => void;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'Super Admin';
    case 'COWORK_ADMIN': return 'Admin Cowork';
    case 'CLIENT_ADMIN': return 'Admin Cliente';
    case 'END_USER': return 'Usuario Final';
    default: return role;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-red-100 text-red-800';
    case 'COWORK_ADMIN': return 'bg-blue-100 text-blue-800';
    case 'CLIENT_ADMIN': return 'bg-green-100 text-green-800';
    case 'END_USER': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return <Shield className="h-4 w-4" />;
    case 'COWORK_ADMIN': return <Building2 className="h-4 w-4" />;
    case 'CLIENT_ADMIN': return <Users className="h-4 w-4" />;
    case 'END_USER': return <User className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

export default function AssignUserModal({ 
  lead, 
  isOpen, 
  onClose, 
  onUserAssigned 
}: AssignUserModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const api = useApi();

  // Load users when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      loadUsers();
    }
  }, [isOpen, lead]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('=== USER ASSIGNMENT MODAL DEBUG ===');
      console.log('Loading users from API for lead assignment...');
      console.log('Lead being assigned:', lead);
      
      // Load users from API - only assignable users (COWORK_ADMIN and END_USER)
      const response = await api.get('/api/users?assignable=true&limit=100');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: No se pudieron cargar los usuarios`);
      }

      const data = await response.json();
      console.log('Users API response:', data);
      
      // Extract users from API response structure
      const usersArray = Array.isArray(data.data?.users) ? data.data.users : [];
      console.log('Extracted users array:', usersArray);
      
      // The backend already filters for assignable users, but let's ensure they're active
      const assignableUsers = usersArray.filter((user: User) => {
        const isAssignable = user.status === 'ACTIVE' && ['COWORK_ADMIN', 'END_USER'].includes(user.role);
        console.log(`User ${user.firstName} ${user.lastName} (${user.role}, status: ${user.status}) - assignable: ${isAssignable}`);
        return isAssignable;
      });

      console.log('Final assignable users:', assignableUsers);
      setUsers(assignableUsers);

      if (assignableUsers.length === 0) {
        console.log('⚠️ No assignable users found in the cowork');
        toast({
          title: "No hay usuarios disponibles",
          description: "No se encontraron usuarios del cowork que puedan ser asignados a prospectos",
          variant: "warning",
        });
      } else {
        console.log(`✅ Found ${assignableUsers.length} assignable users from the current cowork`);
        console.log('Users available for assignment:', assignableUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          status: u.status,
          tenantId: u.tenantId
        })));
      }
    } catch (error) {
      console.error('Error loading users from API:', error);
      
      toast({
        title: "Error al cargar usuarios",
        description: error instanceof Error ? error.message : "No se pudieron cargar los usuarios del cowork",
        variant: "destructive",
      });
      
      // Set empty users array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUser || !lead) return;

    setAssigning(true);
    try {
      // API call to assign user to lead
      const response = await api.put(`/api/leads/${lead.id}`, {
        assignedToId: selectedUser.id
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al asignar usuario');
      }

      const result = await response.json();
      console.log('Usuario asignado exitosamente:', result);

      // Create updated lead object
      const updatedLead: Lead = {
        ...lead,
        assignedTo: {
          id: selectedUser.id,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName
        }
      };

      // Notify parent component
      onUserAssigned(updatedLead, selectedUser);

      toast({
        title: "Usuario asignado",
        description: `${selectedUser.firstName} ${selectedUser.lastName} ha sido asignado al prospecto`,
      });

      // Reset and close
      setSelectedUser(null);
      onClose();

    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error al asignar usuario",
        description: "No se pudo asignar el usuario al prospecto",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!lead || !lead.assignedTo) return;

    setAssigning(true);
    try {
      const response = await api.put(`/api/leads/${lead.id}`, {
        assignedToId: null
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al desasignar usuario');
      }

      // Create updated lead object
      const updatedLead: Lead = {
        ...lead,
        assignedTo: undefined
      };

      // Notify parent component with null user to indicate removal
      onUserAssigned(updatedLead, null as any);

      toast({
        title: "Asignación removida",
        description: "El prospecto ya no tiene usuario asignado",
      });

      onClose();

    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error al desasignar",
        description: "No se pudo remover la asignación del prospecto",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchString = `${user.firstName} ${user.lastName} ${user.email} ${user.phone || ''}`
      .toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Asignar Usuario
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Asignar usuario responsable para: {lead.firstName} {lead.lastName}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Assignment */}
          {lead.assignedTo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">
                        Actualmente asignado a:
                      </p>
                      <p className="text-orange-700">
                        {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAssignment}
                    disabled={assigning}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    {assigning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Desasignar"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Buscar usuario
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o cargo..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Usuarios disponibles ({filteredUsers.length})
            </Label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Cargando usuarios...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No se encontraron usuarios</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <Card 
                    key={user.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedUser?.id === user.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <Badge className={getRoleColor(user.role)}>
                              <span className="flex items-center gap-1">
                                {getRoleIcon(user.role)}
                                {getRoleLabel(user.role)}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <p className="text-sm text-gray-500 mt-1">
                              📞 {user.phone}
                            </p>
                          )}
                        </div>
                        {selectedUser?.id === user.id && (
                          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={assigning}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignUser}
              disabled={!selectedUser || assigning}
              className="min-w-[120px]"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Asignar Usuario
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}