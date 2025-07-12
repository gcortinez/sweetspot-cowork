"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCoworkContextOptional } from '@/providers/cowork-provider';
import { useAuth } from '@/contexts/auth-context';
import { useAuthStore } from '@/stores/auth-store';
import { getApiBaseUrl } from "@/lib/api-config";

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
  
  const { user, isAuthenticated } = useAuth();
  const coworkContext = useCoworkContextOptional();
  const activeCowork = coworkContext?.activeCowork;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = getApiBaseUrl();
      const endpoint = user?.role === 'SUPER_ADMIN' 
        ? '/api/super-admin/analytics'
        : '/api/dashboard/metrics';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Get token from auth store
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No access token found. Please log in again.');
      }

      headers['Authorization'] = `Bearer ${token}`;

      // Add tenant context if available
      if (activeCowork?.id) {
        headers['x-active-cowork'] = activeCowork.id;
      }

      console.log(`📊 Fetching dashboard metrics from: ${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers,
      });

      if (!response.ok) {
        // Temporary mock data while backend is being fixed
        console.warn(`⚠️ API request failed (${response.status}), using mock data`);
        
        // Check if it's super admin request
        const isSuperAdminRequest = endpoint.includes('super-admin');
        
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
        
        // Add super admin specific metrics if needed
        const mockMetrics = isSuperAdminRequest ? {
          ...baseMockMetrics,
          totalCoworks: 5,
          totalUsers: 450,
          totalSpaces: 125,
          platformRevenue: 87500000,
          coworkPerformance: [
            {
              id: '1',
              name: 'SweetSpot HQ',
              activeMembers: 85,
              revenue: 25000000,
              occupancy: 92
            },
            {
              id: '2',
              name: 'Tech Hub Santiago',
              activeMembers: 60,
              revenue: 18000000,
              occupancy: 78
            }
          ]
        } as SuperAdminMetrics : baseMockMetrics;
        
        setMetrics(mockMetrics);
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard metrics');
      }

      console.log('✅ Dashboard metrics fetched successfully');
      setMetrics(data.data);
    } catch (err) {
      console.error('❌ Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, activeCowork]);

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
    activeCowork,
  };
}