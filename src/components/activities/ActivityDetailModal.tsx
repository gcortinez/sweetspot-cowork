'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateActivity } from '@/lib/actions/activities'
import { 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MessageSquare,
  Activity,
  AlertCircle,
  Loader2,
  MapPin,
  Timer,
  Target,
  FileText
} from 'lucide-react'

interface ActivityDetail {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK'
  title: string // Este será el subject del schema
  subject?: string // Para compatibilidad
  description?: string
  dueDate?: string
  completedAt?: string
  outcome?: string // Resultado de la actividad
  duration?: number // Duración en minutos
  location?: string // Ubicación
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  opportunity?: {
    id: string
    title: string
  }
  client?: {
    id: string
    name: string
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface ActivityDetailModalProps {
  activity: ActivityDetail | null
  isOpen: boolean
  onClose: () => void
  onActivityUpdated?: () => void
}

const TYPE_LABELS = {
  'CALL': 'Llamada',
  'EMAIL': 'Email',
  'MEETING': 'Reunión',
  'NOTE': 'Nota',
  'TASK': 'Tarea',
}

const TYPE_ICONS = {
  'CALL': Phone,
  'EMAIL': Mail,
  'MEETING': MessageSquare,
  'NOTE': Activity,
  'TASK': Activity,
}

const TYPE_COLORS = {
  'CALL': 'bg-blue-100 text-blue-800',
  'EMAIL': 'bg-green-100 text-green-800',
  'MEETING': 'bg-purple-100 text-purple-800',
  'NOTE': 'bg-gray-100 text-gray-800',
  'TASK': 'bg-orange-100 text-orange-800',
}

export default function ActivityDetailModal({ 
  activity, 
  isOpen, 
  onClose,
  onActivityUpdated
}: ActivityDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  
  if (!activity) return null

  const isOverdue = activity.dueDate && new Date(activity.dueDate) < new Date() && !activity.completedAt
  const isCompleted = !!activity.completedAt

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    try {
      const result = await updateActivity(activity.id, {
        completedAt: isCompleted ? null : new Date().toISOString()
      })
      
      if (result.success) {
        toast({
          title: isCompleted ? "Actividad marcada como pendiente" : "Actividad completada",
          description: isCompleted 
            ? "La actividad ha sido marcada como pendiente" 
            : "La actividad ha sido marcada como completada",
          duration: 3000,
        })
        onActivityUpdated?.()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la actividad",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating activity:', error)
      toast({
        title: "Error",
        description: "Error al actualizar la actividad",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minuto${minutes === 1 ? '' : 's'}`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} hora${hours === 1 ? '' : 's'}`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  const getTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Activity
    return <IconComponent className="h-5 w-5" />
  }

  const getTypeColor = (type: string) => {
    return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
              {getTypeIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {activity.title}
                <Badge className={getTypeColor(activity.type)}>
                  {TYPE_LABELS[activity.type]}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Badge variant="secondary" className="text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completada
              </Badge>
            ) : isOverdue ? (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Vencida
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Pendiente
              </Badge>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-gray-600 mb-2">Descripción</h4>
                <p className="text-gray-800 whitespace-pre-wrap">{activity.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Outcome/Result */}
          {activity.outcome && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Resultado
                </h4>
                <p className="text-gray-800 whitespace-pre-wrap">{activity.outcome}</p>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Asignado a
                </span>
                <span className="font-medium">
                  {activity.user.firstName} {activity.user.lastName}
                </span>
              </div>

              {activity.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de vencimiento
                  </span>
                  <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {formatShortDate(activity.dueDate)}
                  </span>
                </div>
              )}

              {activity.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Duración
                  </span>
                  <span className="font-medium">
                    {formatDuration(activity.duration)}
                  </span>
                </div>
              )}

              {activity.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </span>
                  <span className="font-medium">
                    {activity.location}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Creada
                </span>
                <span className="text-sm">
                  {formatDate(activity.createdAt)}
                </span>
              </div>

              {activity.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completada
                  </span>
                  <span className="text-sm text-green-600">
                    {formatDate(activity.completedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related entities */}
          {(activity.opportunity || activity.client || activity.lead) && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                {activity.opportunity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Oportunidad</span>
                    <span className="font-medium">{activity.opportunity.title}</span>
                  </div>
                )}
                {activity.client && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cliente</span>
                    <span className="font-medium">{activity.client.name}</span>
                  </div>
                )}
                {activity.lead && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prospecto</span>
                    <span className="font-medium">
                      {activity.lead.firstName} {activity.lead.lastName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleToggleComplete}
              disabled={isUpdating}
              className={isCompleted 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-green-600 hover:bg-green-700"
              }
              size="sm"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isCompleted ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como completada
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} size="sm">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}