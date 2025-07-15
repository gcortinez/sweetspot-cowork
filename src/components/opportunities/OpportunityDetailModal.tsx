"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  Target, 
  TrendingUp, 
  Clock,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Percent
} from 'lucide-react';
import { STAGE_METADATA } from '@/lib/validations/opportunities';
import Link from 'next/link';

interface Opportunity {
  id: string
  title: string
  description?: string
  value: number
  probability: number
  expectedRevenue: number
  stage: keyof typeof STAGE_METADATA
  expectedCloseDate?: Date
  actualCloseDate?: Date
  createdAt: Date
  competitorInfo?: string
  lostReason?: string
  client?: {
    id: string
    name: string
    email: string
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (opportunity: Opportunity) => void;
}

export default function OpportunityDetailModal({ 
  opportunity, 
  isOpen, 
  onClose,
  onEdit
}: OpportunityDetailModalProps) {
  if (!opportunity) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: keyof typeof STAGE_METADATA) => {
    const colors = {
      blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300',
      indigo: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300',
      purple: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300',
      orange: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300',
      yellow: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300',
      green: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300',
      red: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300',
      gray: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300',
    };
    return colors[STAGE_METADATA[stage].color as keyof typeof colors] || colors.gray;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-purple to-purple-700 text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              {opportunity.title}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-4">
              <Badge className={`${getStageColor(opportunity.stage)} border`}>
                {STAGE_METADATA[opportunity.stage].label}
              </Badge>
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{formatCurrency(opportunity.value)}</span>
              </div>
              <div className="flex items-center gap-1 text-white/90">
                <Percent className="h-4 w-4" />
                <span>{opportunity.probability}%</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onEdit && onEdit(opportunity)}
              className="bg-gradient-to-r from-brand-blue to-blue-700 hover:from-brand-blue/90 hover:to-blue-700/90"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Link href={`/opportunities/${opportunity.id}`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver página completa
              </Button>
            </Link>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-success" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-lg">{formatCurrency(opportunity.value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Probabilidad:</span>
                  <span className="font-semibold">{opportunity.probability}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rev. Esperada:</span>
                  <span className="font-semibold text-success">{formatCurrency(opportunity.expectedRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Dates & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Creada:</span>
                  <span className="font-medium">{new Date(opportunity.createdAt).toLocaleDateString()}</span>
                </div>
                {opportunity.expectedCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cierre esperado:</span>
                    <span className="font-medium">{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {opportunity.actualCloseDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cierre real:</span>
                    <span className="font-medium">{new Date(opportunity.actualCloseDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client/Lead Info */}
            {(opportunity.client || opportunity.lead) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {opportunity.client ? (
                      <>
                        <Building2 className="h-5 w-5 text-brand-purple" />
                        Cliente
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-brand-blue" />
                        Prospecto
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {opportunity.client && (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{opportunity.client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{opportunity.client.email}</span>
                      </div>
                    </>
                  )}
                  {opportunity.lead && (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{opportunity.lead.firstName} {opportunity.lead.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{opportunity.lead.email}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assigned To */}
            {opportunity.assignedTo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-brand-green" />
                    Asignado a
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-purple to-purple-700 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {opportunity.assignedTo.firstName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{opportunity.assignedTo.firstName} {opportunity.assignedTo.lastName}</div>
                      <div className="text-sm text-muted-foreground">{opportunity.assignedTo.email}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Description */}
          {opportunity.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-brand-blue" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Competitive Info */}
          {opportunity.competitorInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Información Competitiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.competitorInfo}</p>
              </CardContent>
            </Card>
          )}

          {/* Lost Reason */}
          {opportunity.lostReason && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                  <Clock className="h-5 w-5" />
                  Razón de Pérdida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 whitespace-pre-wrap">{opportunity.lostReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}