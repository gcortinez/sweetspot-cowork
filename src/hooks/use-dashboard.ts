"use client";

import { useState, useEffect, useCallback } from 'react';
// Removed unused imports

interface DashboardMetrics {
  todayBookings: {
    count: number;
    trend: number;
  };
  activeMembers: {
    count: number;
    trend: number;
  };
  spaceOccupancy: {
    occupied: number;
    total: number;
    percentage: number;
  };
  monthlyRevenue: {
    amount: number;
    trend: number;
  };
  recentBookings: Array<{
    id: string;
    spaceName: string;
    clientName: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'booking' | 'payment' | 'member' | 'space' | 'system';
    title: string;
    description: string;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
  }>;
}

interface SuperAdminMetrics extends DashboardMetrics {
  totalCoworks: number;
  totalUsers: number;
  totalSpaces: number;
  platformRevenue: number;
  coworkPerformance: Array<{
    id: string;
    name: string;
    activeMembers: number;
    revenue: number;
    occupancy: number;
  }>;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | SuperAdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified - remove broken dependencies
  const isSuperAdmin = false;

  const fetchMetrics = useCallback(async () => {
    // Simplified mock implementation
    try {
      setIsLoading(true);
      setError(null);

      // Mock data
      const baseMockMetrics: DashboardMetrics = {
        todayBookings: { count: 12, trend: 15 },
        activeMembers: { count: 145, trend: 5 },
        spaceOccupancy: { occupied: 28, total: 35, percentage: 80 },
        monthlyRevenue: { amount: 12500000, trend: 8 },
        recentBookings: [
          {
            id: '1',
            spaceName: 'Sala de Conferencias A',
            clientName: 'Tech Startup Inc.',
            startTime: '10:00 AM',
            endTime: '12:00 PM',
            status: 'confirmed'
          },
          {
            id: '2',
            spaceName: 'Oficina Privada 5',
            clientName: 'Digital Agency',
            startTime: '2:00 PM',
            endTime: '6:00 PM',
            status: 'in-progress'
          }
        ],
        recentActivities: [
          {
            id: '1',
            type: 'booking',
            title: 'Nueva reserva',
            description: 'Tech Startup Inc. reservó Sala de Conferencias A',
            timestamp: 'Hace 5 minutos'
          },
          {
            id: '2',
            type: 'payment',
            title: 'Pago recibido',
            description: 'Digital Agency completó el pago mensual',
            timestamp: 'Hace 1 hora'
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'info',
            title: 'Mantenimiento programado',
            message: 'El sistema estará en mantenimiento el domingo a las 2:00 AM',
            timestamp: 'Hoy'
          }
        ]
      };
      
      setMetrics(baseMockMetrics);
    } catch (err) {
      console.error('❌ Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMetrics = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    isSuperAdmin,
    activeCowork: null,
  };
}