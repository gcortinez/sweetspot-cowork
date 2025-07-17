"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  CLIENT_STATUS, 
  CLIENT_STATUS_METADATA, 
  type ClientStatus,
  type ClientWithRelations 
} from '@/lib/validations/clients';

interface ClientsTableProps {
  clients: ClientWithRelations[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: ClientStatus | 'all') => void;
  onEditClient: (client: ClientWithRelations) => void;
  onDeleteClient: (clientId: string) => void;
  onViewClient: (clientId: string) => void;
  isLoading?: boolean;
}

export default function ClientsTable({
  clients,
  totalPages,
  currentPage,
  onPageChange,
  onSearch,
  onStatusFilter,
  onEditClient,
  onDeleteClient,
  onViewClient,
  isLoading = false
}: ClientsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleStatusChange = (value: string) => {
    const status = value as ClientStatus | 'all';
    setStatusFilter(status);
    onStatusFilter(status);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-80 bg-muted animate-pulse rounded-md"></div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-muted animate-pulse rounded-t-lg"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse border-t"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-lg border border-purple-100">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes por nombre, email o contacto..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(CLIENT_STATUS_METADATA).map(([status, metadata]) => (
                <SelectItem key={status} value={status}>
                  {metadata.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table - Desktop View */}
      <div className="border rounded-lg overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-brand-purple/5 to-purple-50/50">
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Contacto</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Oportunidades</TableHead>
              <TableHead className="font-semibold">Creado</TableHead>
              <TableHead className="font-semibold w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">No se encontraron clientes</p>
                      <p className="text-sm">Ajusta los filtros o crea un nuevo cliente</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.contactPerson && (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{client.contactPerson}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(client.status)} border`}>
                      {CLIENT_STATUS_METADATA[client.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-brand-purple" />
                        <span className="font-medium">{client._count?.opportunities || 0}</span>
                      </div>
                      {client._count?.opportunities && client._count.opportunities > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewClient(client.id)}
                          className="h-6 px-2 text-xs"
                        >
                          Ver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewClient(client.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditClient(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {clients.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No se encontraron clientes</p>
                <p className="text-sm text-muted-foreground">Ajusta los filtros o crea un nuevo cliente</p>
              </div>
            </div>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4 bg-white space-y-3">
              {/* Client Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewClient(client.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditClient(client)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteClient(client.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Estado</div>
                  <Badge className={`${getStatusColor(client.status)} border mt-1`}>
                    {CLIENT_STATUS_METADATA[client.status].label}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Oportunidades</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Target className="h-4 w-4 text-brand-purple" />
                    <span className="font-medium">{client._count?.opportunities || 0}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(client.contactPerson || client.phone) && (
                <div className="border-t pt-3 space-y-1">
                  {client.contactPerson && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{client.contactPerson}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Creation Date */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Creado: {new Date(client.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}