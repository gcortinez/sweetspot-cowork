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
  User, 
  Search, 
  Check, 
  ChevronsUpDown,
  Mail,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { listUsersAction } from "@/lib/actions/user";

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface UserSelectorProps {
  value?: string;
  onValueChange: (userId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function UserSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar usuario...",
  className,
  disabled = false,
  required = false
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const { toast } = useToast();

  // Load initial users and search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsersDebounced(searchQuery);
    } else if (searchQuery.length === 0) {
      // Load some default users when no search query
      searchUsersDebounced('');
    }
  }, [searchQuery]);

  // Find selected user when value changes
  useEffect(() => {
    if (value && users.length > 0) {
      const user = users.find(u => u.id === value);
      if (user) {
        setSelectedUser(user);
      }
    } else if (!value) {
      setSelectedUser(null);
    }
  }, [value, users]);

  const searchUsersDebounced = async (query: string) => {
    setIsSearching(true);
    try {
      const result = await listUsersAction({ 
        search: query || undefined, // Use undefined instead of empty string
        limit: 20,
        page: 1
      });
      
      if (result.success) {
        setUsers(result.users);
      } else {
        console.error('Error searching users:', result.error);
        toast({
          title: "Error al buscar usuarios",
          description: result.error || "No se pudieron cargar los usuarios",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error al buscar usuarios",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    onValueChange(user.id);
    setOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onValueChange(undefined);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      SUPER_ADMIN: 'Super Admin',
      COWORK_ADMIN: 'Admin Cowork',
      CLIENT_ADMIN: 'Admin Cliente',
      END_USER: 'Usuario Final'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300',
      COWORK_ADMIN: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300',
      CLIENT_ADMIN: 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300',
      END_USER: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
    };
    return colors[role as keyof typeof colors] || colors.END_USER;
  };

  return (
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
                !selectedUser && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              {selectedUser ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="h-4 w-4 text-brand-purple flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                  </div>
                  <Badge className={`${getRoleColor(selectedUser.role)} border text-xs`}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{placeholder}</span>
                </div>
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                {selectedUser && (
                  <div
                    className="h-4 w-4 p-0 hover:bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </div>
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
                  placeholder="Buscar usuario..."
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
                ) : users.length === 0 ? (
                  <div className="py-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      No se encontraron usuarios.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                          "hover:bg-muted",
                          selectedUser?.id === user.id && "bg-muted"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${getRoleColor(user.role)} border text-xs`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {selectedUser && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span>{selectedUser.email}</span>
          </div>
        </div>
      )}
    </div>
  );
}