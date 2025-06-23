"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCoworkContextOptional } from '@/providers/cowork-provider';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

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

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
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
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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