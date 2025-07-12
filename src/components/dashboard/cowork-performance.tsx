"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoworkPerformance {
  id: string;
  name: string;
  activeMembers: number;
  revenue: number;
  occupancy: number;
}

interface CoworkPerformanceProps {
  coworks: CoworkPerformance[];
  className?: string;
}

export function CoworkPerformanceCard({ 
  coworks, 
  className 
}: CoworkPerformanceProps) {
  // Validate coworks array
  const safeCoworks = Array.isArray(coworks) ? coworks : [];
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'text-green-600 dark:text-green-400';
    if (occupancy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getOccupancyBg = (occupancy: number) => {
    if (occupancy >= 80) return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    if (occupancy >= 60) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  };

  return (
    <Card className={cn('dashboard-card', className)}>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Rendimiento de Coworks
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Ver detalles
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {safeCoworks.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay datos de coworks disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeCoworks.map((cowork, index) => (
              <div
                key={cowork.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : index === 1
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        : index === 2
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Cowork Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {cowork.name}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Members */}
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {cowork.activeMembers} miembros
                      </span>
                    </div>

                    {/* Revenue */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatCurrency(cowork.revenue)}
                      </span>
                    </div>

                    {/* Occupancy */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-purple-500" />
                      <span className={cn(
                        'text-xs font-medium',
                        getOccupancyColor(cowork.occupancy)
                      )}>
                        {cowork.occupancy.toFixed(1)}% ocupación
                      </span>
                    </div>
                  </div>
                </div>

                {/* Occupancy Badge */}
                <div className="flex-shrink-0">
                  <Badge className={cn(
                    'text-xs',
                    getOccupancyBg(cowork.occupancy)
                  )}>
                    {cowork.occupancy >= 80 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {cowork.occupancy.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}