"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  AlertCircle,
  Eye,
  Target
} from "lucide-react";
import {
  CLIENT_STATUS_METADATA,
  type ClientStatus,
  type ClientWithRelations
} from "@/lib/validations/clients";

interface ViewClientModalProps {
  client: ClientWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewClientModal({
  client,
  isOpen,
  onClose
}: ViewClientModalProps) {

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

  const getStatusIconColor = (status: ClientStatus) => {
    const colors = {
      blue: 'bg-blue-500',
      indigo: 'bg-indigo-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
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
                <Eye className="h-5 w-5 text-white" />
              </div>
              Ver Cliente
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Información detallada del cliente "{client.name}".
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-brand-blue" />
              <span>Información Básica</span>
            </div>
            <div className="space-y-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-lg border border-purple-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombre de la Empresa
                  </label>
                  <div className="p-3 bg-white rounded-md border text-sm">
                    {client.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="p-3 bg-white rounded-md border text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${client.email}`}
                      className="text-brand-purple hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Teléfono
                  </label>
                  <div className="p-3 bg-white rounded-md border text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="text-brand-purple hover:underline"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No especificado</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Persona de Contacto
                  </label>
                  <div className="p-3 bg-white rounded-md border text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {client.contactPerson || (
                      <span className="text-muted-foreground">No especificado</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Dirección
                </label>
                <div className="p-3 bg-white rounded-md border text-sm flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  {client.address || (
                    <span className="text-muted-foreground">No especificada</span>
                  )}
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
                <label className="text-sm font-medium text-foreground">
                  NIT / RUT
                </label>
                <div className="p-3 bg-white rounded-md border text-sm">
                  {client.taxId || (
                    <span className="text-muted-foreground">No especificado</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Estado del Cliente
                </label>
                <div className="p-3 bg-white rounded-md border text-sm">
                  <Badge className={`${getStatusColor(client.status)} border`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusIconColor(client.status)}`}></div>
                      <span>{CLIENT_STATUS_METADATA[client.status].label}</span>
                    </div>
                  </Badge>
                </div>
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
                <label className="text-sm font-medium text-foreground">
                  Notas
                </label>
                <div className="p-3 bg-white rounded-md border text-sm min-h-[80px] whitespace-pre-wrap">
                  {client.notes || (
                    <span className="text-muted-foreground">Sin notas adicionales</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Stats */}
          {client._count && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="h-4 w-4 text-brand-green" />
                <span>Estadísticas del Cliente</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4 rounded-lg border border-green-200">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-700">{client._count.opportunities}</div>
                  <div className="text-sm text-muted-foreground">Oportunidades</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-700">{client._count.leads || 0}</div>
                  <div className="text-sm text-muted-foreground">Prospectos</div>
                </div>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
              <span>Información de Fechas</span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 p-4 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Cliente desde
                </label>
                <div className="p-3 bg-white rounded-md border text-sm">
                  {new Date(client.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Última actualización
                </label>
                <div className="p-3 bg-white rounded-md border text-sm">
                  {new Date(client.updatedAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center pt-6 border-t">
            <Button
              type="button"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}