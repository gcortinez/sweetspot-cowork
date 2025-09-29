'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  Users,
  Clock,
  DollarSign,
  Settings,
  Eye,
  Edit,
  Calendar,
  Shield,
  RotateCcw,
  CheckCircle,
  XCircle,
  Palette,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Space {
  id: string
  name: string
  type: string
  description?: string
  capacity: number
  floor?: string
  zone?: string
  area?: number
  hourlyRate?: number
  isActive: boolean
  requiresApproval: boolean
  allowRecurring: boolean
  maxAdvanceBooking: number
  minBookingDuration: number
  cancellationHours: number
  color?: string
  createdAt: Date
  updatedAt: Date
}

interface SpaceCardEnhancedProps {
  space: Space
  viewMode?: 'grid' | 'list'
  showActions?: boolean
  onViewDetails?: (space: Space) => void
  onEdit?: (space: Space) => void
  onBook?: (space: Space) => void
  className?: string
}

export function SpaceCardEnhanced({
  space,
  viewMode = 'grid',
  showActions = true,
  onViewDetails,
  onEdit,
  onBook,
  className,
}: SpaceCardEnhancedProps) {
  const router = useRouter()

  const formatSpaceType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Gratuito'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatLocation = () => {
    const parts = [space.floor, space.zone].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Ubicación no especificada'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(space)
    } else {
      router.push(`/spaces/${space.id}`)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(space)
    } else {
      router.push(`/spaces/${space.id}/edit`)
    }
  }

  const handleBook = () => {
    if (onBook) {
      onBook(space)
    } else {
      router.push(`/bookings/new?spaceId=${space.id}`)
    }
  }

  const isGridView = viewMode === 'grid'

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-200 hover:shadow-lg',
        isGridView ? 'flex flex-col h-full' : 'flex flex-row',
        !space.isActive && 'opacity-75 bg-muted/50',
        className
      )}
    >
      {/* Image placeholder - will be enhanced in FASE 7 with actual images */}
      <div className={cn(
        'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900',
        'flex items-center justify-center relative',
        isGridView ? 'h-48 w-full' : 'w-48 h-32 flex-shrink-0'
      )}>
        <div className="text-center">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 mx-auto shadow-sm">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {formatSpaceType(space.type)}
          </p>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={space.isActive ? 'default' : 'secondary'} className="text-xs">
            {space.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Espacio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBook}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reservar Espacio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex flex-col',
        isGridView ? 'flex-1' : 'flex-1 min-w-0'
      )}>
        <CardHeader className={cn(isGridView ? 'pb-4' : 'pb-2')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{space.name}</CardTitle>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm truncate">{formatLocation()}</span>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {formatSpaceType(space.type)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={cn('space-y-4', isGridView ? 'flex-1' : 'py-0')}>
          {/* Description */}
          {space.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {space.description}
            </p>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{space.capacity} personas</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{formatCurrency(space.hourlyRate)}/hr</span>
            </div>
            {space.area && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{space.area} m²</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Mín {formatDuration(space.minBookingDuration)}</span>
            </div>
            {space.color && (
              <div className="flex items-center gap-2 col-span-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span>Color:</span>
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: space.color }}
                  title={`Color: ${space.color}`}
                />
                <span className="text-muted-foreground text-xs">{space.color}</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {space.requiresApproval && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Requiere Aprobación
              </Badge>
            )}
            {space.allowRecurring && (
              <Badge variant="outline" className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                Recurrente
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {space.maxAdvanceBooking}d anticipación
            </Badge>
          </div>

          {/* Booking Settings Summary */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Duración mín:</span>
              <span>{formatDuration(space.minBookingDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancelación:</span>
              <span>{space.cancellationHours}h aviso</span>
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        <div className={cn('p-6 pt-0', !isGridView && 'p-4 pt-0')}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button
              size="sm"
              onClick={handleBook}
              disabled={!space.isActive}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Reservar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}