'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Target,
  Eye,
  ArrowRight,
  MapPin,
  Star,
  Clock,
  UserCheck,
  Briefcase,
  Globe
} from 'lucide-react'
import Link from 'next/link'

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  type: 'prospect' | 'client' | 'opportunity'
}

export default function QuickViewModal({ isOpen, onClose, data, type }: QuickViewModalProps) {
  if (!data) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'prospect':
        return {
          title: 'Vista Rápida - Prospecto',
          icon: UserCheck,
          color: 'blue',
          route: '/leads',
          buttonText: 'Ver Prospecto Completo'
        }
      case 'client':
        return {
          title: 'Vista Rápida - Cliente',
          icon: Building2,
          color: 'green',
          route: '/clients',
          buttonText: 'Ver Cliente Completo'
        }
      case 'opportunity':
        return {
          title: 'Vista Rápida - Oportunidad',
          icon: Target,
          color: 'purple',
          route: '/opportunities',
          buttonText: 'Ver Oportunidad Completa'
        }
      default:
        return {
          title: 'Vista Rápida',
          icon: Eye,
          color: 'gray',
          route: '/',
          buttonText: 'Ver Completo'
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      // Prospect statuses
      'NEW': 'bg-blue-100 text-blue-800 border-blue-300',
      'CONTACTED': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'QUALIFIED': 'bg-green-100 text-green-800 border-green-300',
      'UNQUALIFIED': 'bg-gray-100 text-gray-800 border-gray-300',
      'CONVERTED': 'bg-purple-100 text-purple-800 border-purple-300',
      'LOST': 'bg-red-100 text-red-800 border-red-300',
      // Client statuses
      'ACTIVE': 'bg-green-100 text-green-800 border-green-300',
      'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-300',
      'PROSPECT': 'bg-blue-100 text-blue-800 border-blue-300',
      'CHURNED': 'bg-red-100 text-red-800 border-red-300',
      // Opportunity stages
      'INITIAL_CONTACT': 'bg-blue-100 text-blue-800 border-blue-300',
      'NEEDS_ANALYSIS': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'PROPOSAL_SENT': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'NEGOTIATION': 'bg-orange-100 text-orange-800 border-orange-300',
      'CONTRACT_REVIEW': 'bg-purple-100 text-purple-800 border-purple-300',
      'CLOSED_WON': 'bg-green-100 text-green-800 border-green-300',
      'CLOSED_LOST': 'bg-red-100 text-red-800 border-red-300',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      // Prospect statuses
      'NEW': 'Nuevo',
      'CONTACTED': 'Contactado',
      'QUALIFIED': 'Calificado',
      'UNQUALIFIED': 'No Calificado',
      'CONVERTED': 'Convertido',
      'LOST': 'Perdido',
      // Client statuses
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'PROSPECT': 'Prospecto',
      'CHURNED': 'Perdido',
      // Opportunity stages
      'INITIAL_CONTACT': 'Contacto Inicial',
      'NEEDS_ANALYSIS': 'Análisis de Necesidades',
      'PROPOSAL_SENT': 'Propuesta Enviada',
      'NEGOTIATION': 'Negociación',
      'CONTRACT_REVIEW': 'Revisión de Contrato',
      'CLOSED_WON': 'Cerrada Ganada',
      'CLOSED_LOST': 'Cerrada Perdida',
    }
    return statusLabels[status] || status
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-${config.color}-100 flex items-center justify-center`}>
              <IconComponent className={`h-4 w-4 text-${config.color}-600`} />
            </div>
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {type === 'prospect' ? `${data.firstName} ${data.lastName}` :
                 type === 'client' ? data.name :
                 data.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {type === 'prospect' ? data.email :
                 type === 'client' ? data.email :
                 type === 'opportunity' ? (data.client?.name || (data.lead ? `${data.lead.firstName} ${data.lead.lastName}` : 'Cliente no especificado')) :
                 data.client}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(data.status || data.stage)} border`}>
                {getStatusLabel(data.status || data.stage)}
              </Badge>
              {data.score && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Score: {data.score}
                </Badge>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Email */}
                {(data.email || data.client?.email || data.lead?.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {data.email || data.client?.email || data.lead?.email}
                    </span>
                  </div>
                )}
                
                {/* Phone */}
                {(data.phone || data.client?.phone || data.lead?.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {data.phone || data.client?.phone || data.lead?.phone}
                    </span>
                  </div>
                )}
                
                {/* Company/Position */}
                {(data.company || data.position || data.client?.company || data.lead?.company) && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {data.position && data.company ? `${data.position} en ${data.company}` :
                       data.company || data.position || data.client?.company || data.lead?.company}
                    </span>
                  </div>
                )}
                
                {/* Client/Lead Name for opportunities */}
                {type === 'opportunity' && (data.client?.name || data.lead) && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {data.client?.name || (data.lead ? `${data.lead.firstName} ${data.lead.lastName}` : '')}
                    </span>
                  </div>
                )}
                
                {/* Contact Person */}
                {data.client?.contactPerson && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Contacto: {data.client.contactPerson}</span>
                  </div>
                )}
                
                {/* Source */}
                {data.source && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Origen: {data.source}</span>
                  </div>
                )}
                
                {/* If no contact information is available */}
                {!data.email && !data.phone && !data.company && !data.position && 
                 !data.client?.email && !data.client?.phone && !data.client?.company && !data.client?.name &&
                 !data.lead?.email && !data.lead?.phone && !data.lead?.company && !data.lead?.firstName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">No hay información de contacto disponible</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatCurrency(data.value)}</span>
                  </div>
                )}
                {data.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Presupuesto: {formatCurrency(data.budget)}</span>
                  </div>
                )}
                {data.probability && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Probabilidad: {data.probability}%</span>
                  </div>
                )}
                {data.expectedCloseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Cierre: {new Date(data.expectedCloseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {data.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Creado: {new Date(data.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {data.opportunitiesCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {data.opportunitiesCount} oportunidad{data.opportunitiesCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description/Notes */}
          {(data.description || data.qualificationNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {type === 'opportunity' ? 'Descripción' : 'Notas'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {data.description || data.qualificationNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Link href={data.id ? `${config.route}/${data.id}` : config.route}>
              <Button className={`bg-${config.color}-600 hover:bg-${config.color}-700`}>
                {config.buttonText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}