"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Motion, StaggerContainer } from '@/components/ui/motion';

interface Booking {
  id: string;
  spaceName: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface RecentBookingsProps {
  bookings: Booking[];
  context?: 'default' | 'cowork' | 'super-admin';
  className?: string;
}

export function RecentBookings({ 
  bookings, 
  context = 'default',
  className 
}: RecentBookingsProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'confirmada':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'in_progress':
      case 'en_progreso':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
            <Clock className="h-3 w-3 mr-1" />
            En Progreso
          </Badge>
        );
      case 'completed':
      case 'completada':
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case 'cancelled':
      case 'cancelada':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM', { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className={cn('dashboard-card', className)}>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center',
              context === 'super-admin' 
                ? 'bg-purple-100 dark:bg-purple-900/30' 
                : context === 'cowork'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <Calendar className={cn(
                'h-4 w-4',
                context === 'super-admin' 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : context === 'cowork'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
              )} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reservas Recientes
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Ver todas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay reservas recientes
            </p>
          </div>
        ) : (
          <StaggerContainer stagger={100} animation="fade-in-up" className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer hover-lift"
              >
                {/* Avatar */}
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm',
                  getAvatarColor(booking.clientName)
                )}>
                  {getInitials(booking.clientName)}
                </div>

                {/* Booking Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {booking.spaceName}
                    </p>
                    <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {booking.clientName}
                  </p>
                </div>

                {/* Time & Status */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(booking.startTime)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            ))}
          </StaggerContainer>
        )}
      </div>
    </Card>
  );
}