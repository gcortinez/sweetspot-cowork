"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useCoworkSelection } from '@/contexts/cowork-selection-context';

interface PlatformStats {
  overview: {
    totalCoworks: number;
    activeCoworks: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
  };
  coworkStats: {
    byStatus: Record<string, number>;
    recentlyCreated: number;
    averageUsersPerCowork: number;
  };
  userStats: {
    byRole: Record<string, number>;
    newUsersThisMonth: number;
    activeUsersToday: number;
  };
  revenueStats: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    averagePerCowork: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'cowork_created' | 'user_registered' | 'payment_received' | 'cowork_activated';
  message: string;
  timestamp: string;
  metadata?: any;
}

// Loading stats - shown while data loads
const loadingStats: PlatformStats = {
  overview: {
    totalCoworks: 0,
    activeCoworks: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  },
  coworkStats: {
    byStatus: {
      active: 0,
      inactive: 0,
      suspended: 0
    },
    recentlyCreated: 0,
    averageUsersPerCowork: 0
  },
  userStats: {
    byRole: {
      super_admin: 0,
      cowork_admin: 0,
      cowork_user: 0,
      client_admin: 0,
      end_user: 0
    },
    newUsersThisMonth: 0,
    activeUsersToday: 0
  },
  revenueStats: {
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
    averagePerCowork: 0
  }
};

const defaultActivities: RecentActivity[] = [];

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(loadingStats);
  const [activities, setActivities] = useState<RecentActivity[]>(defaultActivities);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to cowork selection changes to refresh stats
  const { refreshCoworks } = useCoworkSelection();

  // Set mounted after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize data to prevent layout expansion
  const normalizeActivityMessage = (message: string): string => {
    // Ensure consistent message length by truncating long cowork names
    if (message.includes('Cowork "') && message.length > 50) {
      const parts = message.split('"');
      if (parts.length >= 3) {
        const coworkName = parts[1];
        const truncatedName = coworkName.length > 15 
          ? coworkName.substring(0, 15) + '...' 
          : coworkName;
        return message.replace(`"${coworkName}"`, `"${truncatedName}"`);
      }
    }
    return message.length > 50 ? message.substring(0, 47) + '...' : message;
  };

  const normalizeActivities = (activities: RecentActivity[]): RecentActivity[] => {
    return activities.slice(0, 3).map(activity => ({
      ...activity,
      message: normalizeActivityMessage(activity.message),
      timestamp: activity.timestamp.length > 15 
        ? activity.timestamp.substring(0, 12) + '...' 
        : activity.timestamp
    }));
  };

  // Fetch real data immediately and set up auto-refresh
  const fetchRealData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/platform/stats', {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setActivities(normalizeActivities(data.activities || defaultActivities));
          console.log('📊 Platform stats updated:', data.stats.overview);
        }
      } else {
        console.log('📊 Platform stats API failed:', response.status);
      }
    } catch (error) {
      console.error('📊 Platform stats fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data immediately when component mounts
  useEffect(() => {
    if (!mounted) return;
    fetchRealData();
  }, [mounted, fetchRealData]);

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      fetchRealData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [mounted, fetchRealData]);

  // Expose refresh function globally for manual refresh
  useEffect(() => {
    // Add to window for manual refresh from cowork management
    (window as any).refreshPlatformStats = fetchRealData;

    return () => {
      delete (window as any).refreshPlatformStats;
    };
  }, [fetchRealData]);

  // Always render content with loading indicator
  return (
    <div className="w-full max-w-full space-y-3 sm:space-y-4 lg:space-y-6 overflow-hidden min-w-0 break-words">
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2 border">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="text-sm text-gray-600">Actualizando estadísticas...</span>
        </div>
      )}
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 min-w-0 auto-cols-fr">
        {/* Active Coworks */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow min-w-0 overflow-hidden break-words">
          <div className="flex items-start justify-between min-w-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Coworks Activos</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 break-all w-16 min-w-0">{stats.overview.activeCoworks}</p>
              <p className="text-xs text-gray-500 flex items-center mt-1.5 min-w-0">
                <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate min-w-0 max-w-20">{stats.overview.totalCoworks} total</span>
              </p>
            </div>
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow min-w-0 overflow-hidden break-words">
          <div className="flex items-start justify-between min-w-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Usuarios</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 break-all w-16 min-w-0">{stats.overview.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1.5 min-w-0">
                <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate min-w-0 max-w-24">+{stats.userStats.newUsersThisMonth} este mes</span>
              </p>
            </div>
            <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow min-w-0 overflow-hidden break-words">
          <div className="flex items-start justify-between min-w-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Ingresos Mes</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 break-all">
                ${stats.overview.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1.5 min-w-0">
                <ArrowUpRight className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate min-w-0">+{stats.overview.revenueGrowth}% vs mes anterior</span>
              </p>
            </div>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        {/* Active Users Today */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow min-w-0 overflow-hidden break-words">
          <div className="flex items-start justify-between min-w-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Usuarios Activos Hoy</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 break-all w-16 min-w-0">{stats.userStats.activeUsersToday}</p>
              <p className="text-xs text-gray-500 mt-1.5 truncate max-w-24">
                {stats.overview.totalUsers > 0 
                  ? Math.round((stats.userStats.activeUsersToday / stats.overview.totalUsers) * 100)
                  : 0
                }% del total
              </p>
            </div>
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0">
        {/* Cowork Breakdown */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border min-w-0 overflow-hidden break-words">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center min-w-0">
            <Building2 className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
            <span className="truncate min-w-0">Estado de Coworks</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 truncate mr-2">Activos</span>
              <div className="flex items-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {stats.coworkStats.byStatus.active || 0}
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 truncate mr-2">Inactivos</span>
              <div className="flex items-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {stats.coworkStats.byStatus.inactive || 0}
                </span>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 truncate mr-2">Suspendidos</span>
              <div className="flex items-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {stats.coworkStats.byStatus.suspended || 0}
                </span>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 truncate">
                Promedio: {stats.coworkStats.averageUsersPerCowork} usuarios por cowork
              </div>
            </div>
          </div>
        </div>

        {/* User Roles Breakdown */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border min-w-0 overflow-hidden break-words">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center min-w-0">
            <Users className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
            <span className="truncate min-w-0">Usuarios por Rol</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.userStats.byRole).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize truncate mr-2">
                  {role.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border min-w-0 overflow-hidden break-words">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center min-w-0">
            <Clock className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
            <span className="truncate min-w-0">Actividad Reciente</span>
          </h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'cowork_created' && (
                    <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  )}
                  {activity.type === 'user_registered' && (
                    <Users className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  {activity.type === 'payment_received' && (
                    <DollarSign className="h-4 w-4 text-purple-600 mt-0.5" />
                  )}
                  {activity.type === 'cowork_activated' && (
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformStats;