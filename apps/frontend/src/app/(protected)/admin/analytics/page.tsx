"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  ArrowLeft,
  Download,
  Filter,
  Eye,
  Zap,
  Target,
  Activity,
  PieChart,
  LineChart,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  period: string;
  revenue: number;
  bookings: number;
  occupancy: number;
  members: number;
  avgSessionDuration: number;
  utilizationRate: number;
}

interface SpaceAnalytics {
  id: string;
  name: string;
  type: string;
  totalBookings: number;
  revenue: number;
  occupancyRate: number;
  avgDuration: number;
  peakHours: string[];
  satisfaction: number;
}

interface MemberAnalytics {
  segment: string;
  count: number;
  revenue: number;
  avgBookings: number;
  retention: number;
  growth: number;
}

const AdminAnalyticsPage: React.FC = () => {
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue");

  // Mock analytics data
  const timeSeriesData: AnalyticsData[] = [
    {
      period: "Ene 2024",
      revenue: 32500,
      bookings: 245,
      occupancy: 68,
      members: 89,
      avgSessionDuration: 4.2,
      utilizationRate: 72,
    },
    {
      period: "Feb 2024",
      revenue: 38200,
      bookings: 289,
      occupancy: 75,
      members: 95,
      avgSessionDuration: 4.5,
      utilizationRate: 78,
    },
    {
      period: "Mar 2024",
      revenue: 42100,
      bookings: 312,
      occupancy: 81,
      members: 108,
      avgSessionDuration: 4.8,
      utilizationRate: 84,
    },
    {
      period: "Abr 2024",
      revenue: 39800,
      bookings: 298,
      occupancy: 76,
      members: 112,
      avgSessionDuration: 4.3,
      utilizationRate: 79,
    },
    {
      period: "May 2024",
      revenue: 45600,
      bookings: 334,
      occupancy: 85,
      members: 125,
      avgSessionDuration: 5.1,
      utilizationRate: 88,
    },
    {
      period: "Jun 2024",
      revenue: 48300,
      bookings: 356,
      occupancy: 89,
      members: 134,
      avgSessionDuration: 5.3,
      utilizationRate: 91,
    },
  ];

  const spaceAnalytics: SpaceAnalytics[] = [
    {
      id: "1",
      name: "Oficina Ejecutiva A",
      type: "private_office",
      totalBookings: 89,
      revenue: 8900,
      occupancyRate: 92,
      avgDuration: 3.5,
      peakHours: ["09:00-11:00", "14:00-16:00"],
      satisfaction: 4.8,
    },
    {
      id: "2",
      name: "Sala de Reuniones B",
      type: "meeting_room",
      totalBookings: 156,
      revenue: 4680,
      occupancyRate: 78,
      avgDuration: 2.2,
      peakHours: ["10:00-12:00", "15:00-17:00"],
      satisfaction: 4.6,
    },
    {
      id: "3",
      name: "Hot Desk Zone",
      type: "hot_desk",
      totalBookings: 234,
      revenue: 7020,
      occupancyRate: 85,
      avgDuration: 6.8,
      peakHours: ["08:00-10:00", "13:00-18:00"],
      satisfaction: 4.3,
    },
    {
      id: "4",
      name: "Sala de Conferencias",
      type: "conference_room",
      totalBookings: 45,
      revenue: 6750,
      occupancyRate: 65,
      avgDuration: 3.2,
      peakHours: ["09:00-12:00"],
      satisfaction: 4.9,
    },
  ];

  const memberAnalytics: MemberAnalytics[] = [
    {
      segment: "Enterprise",
      count: 28,
      revenue: 25200,
      avgBookings: 12.5,
      retention: 95,
      growth: 8.2,
    },
    {
      segment: "Premium",
      count: 45,
      revenue: 15750,
      avgBookings: 8.3,
      retention: 88,
      growth: 12.1,
    },
    {
      segment: "Basic",
      count: 67,
      revenue: 6030,
      avgBookings: 4.2,
      retention: 72,
      growth: 15.8,
    },
    {
      segment: "Day Pass",
      count: 89,
      revenue: 1780,
      avgBookings: 1.8,
      retention: 45,
      growth: 22.3,
    },
  ];

  const periodOptions = [
    { value: "week", label: t("analytics.thisWeek") },
    { value: "month", label: t("analytics.thisMonth") },
    { value: "quarter", label: t("analytics.thisQuarter") },
    { value: "year", label: t("analytics.thisYear") },
  ];

  const metricOptions = [
    { value: "revenue", label: t("analytics.revenue") },
    { value: "bookings", label: t("analytics.bookings") },
    { value: "occupancy", label: t("analytics.occupancy") },
    { value: "members", label: t("analytics.members") },
  ];

  // Calculate current period metrics
  const currentData = timeSeriesData[timeSeriesData.length - 1];
  const previousData = timeSeriesData[timeSeriesData.length - 2];
  
  const revenueGrowth = ((currentData.revenue - previousData.revenue) / previousData.revenue * 100);
  const bookingsGrowth = ((currentData.bookings - previousData.bookings) / previousData.bookings * 100);
  const occupancyGrowth = currentData.occupancy - previousData.occupancy;
  const membersGrowth = ((currentData.members - previousData.members) / previousData.members * 100);

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSpaceTypeIcon = (type: string) => {
    switch (type) {
      case 'private_office':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'meeting_room':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'hot_desk':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'conference_room':
        return <Target className="h-4 w-4 text-orange-600" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                  {t("analytics.dashboard")}
                </h1>
                <p className="text-sm sm:text-body text-gray-600 mt-1">
                  {t("analytics.description")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {t("analytics.export")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("analytics.totalRevenue")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentData.revenue)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(revenueGrowth)}
                <span className={`text-sm font-medium ${getTrendColor(revenueGrowth)}`}>
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("analytics.totalBookings")}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.bookings}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(bookingsGrowth)}
                <span className={`text-sm font-medium ${getTrendColor(bookingsGrowth)}`}>
                  {bookingsGrowth > 0 ? '+' : ''}{bookingsGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("analytics.averageOccupancy")}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.occupancy}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(occupancyGrowth)}
                <span className={`text-sm font-medium ${getTrendColor(occupancyGrowth)}`}>
                  {occupancyGrowth > 0 ? '+' : ''}{occupancyGrowth}pp
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("analytics.activeMembers")}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.members}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(membersGrowth)}
                <span className={`text-sm font-medium ${getTrendColor(membersGrowth)}`}>
                  {membersGrowth > 0 ? '+' : ''}{membersGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Trend Chart Placeholder */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.revenueTrend")}</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {metricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Simple trend visualization */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {timeSeriesData.map((data, index) => {
              const height = selectedMetric === 'revenue' 
                ? (data.revenue / Math.max(...timeSeriesData.map(d => d.revenue))) * 100
                : selectedMetric === 'bookings'
                ? (data.bookings / Math.max(...timeSeriesData.map(d => d.bookings))) * 100
                : selectedMetric === 'occupancy'
                ? (data.occupancy / 100) * 100
                : (data.members / Math.max(...timeSeriesData.map(d => d.members))) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-12 bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-600 text-center">
                    {data.period.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Space Performance Analysis */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.spacePerformance")}</h3>
            </div>
            
            <div className="space-y-4">
              {spaceAnalytics.map((space) => (
                <div key={space.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getSpaceTypeIcon(space.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{space.name}</h4>
                        <p className="text-sm text-gray-600">{space.totalBookings} {t("analytics.bookingsCount")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(space.revenue)}
                      </p>
                      <p className="text-sm text-gray-600">{space.occupancyRate}% {t("analytics.occupancy")}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t("analytics.avgDuration")}</p>
                      <p className="font-medium">{space.avgDuration}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t("analytics.satisfaction")}</p>
                      <p className="font-medium">{space.satisfaction}/5.0</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t("analytics.peakHours")}</p>
                      <p className="font-medium text-xs">{space.peakHours[0]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Member Segments Analysis */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.segmentAnalysis")}</h3>
            </div>
            
            <div className="space-y-4">
              {memberAnalytics.map((segment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{segment.segment}</h4>
                      <p className="text-sm text-gray-600">{segment.count} {t("analytics.membersCount")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(segment.revenue)}
                      </p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(segment.growth)}
                        <span className={`text-xs ${getTrendColor(segment.growth)}`}>
                          {segment.growth > 0 ? '+' : ''}{segment.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t("analytics.retention")}</p>
                      <p className="font-medium">{segment.retention}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t("analytics.bookingsPerMonth")}</p>
                      <p className="font-medium">{segment.avgBookings}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.timeUsage")}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.averageDuration")}</span>
                <span className="text-sm font-medium">{currentData.avgSessionDuration}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.utilizationRate")}</span>
                <span className="text-sm font-medium">{currentData.utilizationRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.peakHours")}</span>
                <span className="text-sm font-medium">9-11 AM</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.efficiency")}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.confirmationRate")}</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.responseTime")}</span>
                <span className="text-sm font-medium">12 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.overallSatisfaction")}</span>
                <span className="text-sm font-medium">4.7/5.0</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("analytics.projections")}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.q4Revenue")}</span>
                <span className="text-sm font-medium">$156K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.newMembers")}</span>
                <span className="text-sm font-medium">+28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t("analytics.annualGrowth")}</span>
                <span className="text-sm font-medium text-green-600">+18.5%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;