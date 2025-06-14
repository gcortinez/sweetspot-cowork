"use client";

import { useState, useEffect } from "react";
import {
  MetricWidget,
  QuickActionWidget,
  ActivityFeedWidget,
  ChartWidget,
  StatusIndicatorWidget,
  CommonMetrics,
} from "./dashboard-widgets";
import { SuperAdminOnly } from "@/components/rbac/role-gate";
import {
  TenantManagementFeature,
  SystemSettingsFeature,
} from "@/components/rbac/feature-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  Server,
  Globe,
  AlertTriangle,
  Plus,
  Eye,
  Wrench,
} from "lucide-react";

interface SuperAdminDashboardProps {
  className?: string;
}

export function SuperAdminDashboard({
  className = "",
}: SuperAdminDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalSpaces: 0,
    totalBookings: 0,
    systemUptime: "99.9%",
    activeConnections: 0,
    storageUsed: "0 GB",
    monthlyRevenue: 0,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: "1",
      title: "New tenant registered",
      description: "Acme Coworking joined the platform",
      timestamp: "2 minutes ago",
      type: "system" as const,
    },
    {
      id: "2",
      title: "System maintenance completed",
      description: "Database optimization finished successfully",
      timestamp: "1 hour ago",
      type: "system" as const,
    },
    {
      id: "3",
      title: "High usage alert",
      description: "Server CPU usage exceeded 80%",
      timestamp: "3 hours ago",
      type: "system" as const,
    },
  ]);

  const [systemStatus, setSystemStatus] = useState([
    {
      status: "online" as const,
      label: "API Gateway",
      description: "All endpoints operational",
    },
    {
      status: "online" as const,
      label: "Database",
      description: "Primary and replica healthy",
    },
    {
      status: "warning" as const,
      label: "File Storage",
      description: "85% capacity used",
    },
    {
      status: "online" as const,
      label: "Authentication",
      description: "All auth services running",
    },
  ]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setSystemMetrics({
      totalTenants: 24,
      totalUsers: 1247,
      totalSpaces: 156,
      totalBookings: 3421,
      systemUptime: "99.9%",
      activeConnections: 89,
      storageUsed: "127 GB",
      monthlyRevenue: 45600,
    });
  }, []);

  const handleCreateTenant = () => {
    console.log("Navigate to create tenant");
  };

  const handleViewAnalytics = () => {
    console.log("Navigate to system analytics");
  };

  const handleManageUsers = () => {
    console.log("Navigate to user management");
  };

  const handleSystemSettings = () => {
    console.log("Navigate to system settings");
  };

  const handleViewLogs = () => {
    console.log("Navigate to system logs");
  };

  const handleBackupManagement = () => {
    console.log("Navigate to backup management");
  };

  return (
    <SuperAdminOnly>
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Overview
            </h1>
            <p className="text-gray-600">
              Monitor and manage the entire SweetSpot platform
            </p>
          </div>
          <TenantManagementFeature>
            <Button
              onClick={handleCreateTenant}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tenant
            </Button>
          </TenantManagementFeature>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStatus.map((status, index) => (
                <StatusIndicatorWidget
                  key={index}
                  status={status.status}
                  label={status.label}
                  description={status.description}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CommonMetrics.TotalUsers
            title="Total Users"
            value={systemMetrics.totalUsers.toLocaleString()}
            description="Across all tenants"
            trend={{ value: 12, isPositive: true }}
          />

          <MetricWidget
            title="Active Tenants"
            value={systemMetrics.totalTenants}
            description="Paying customers"
            trend={{ value: 8, isPositive: true }}
            icon={<Building2 className="h-4 w-4" />}
          />

          <CommonMetrics.TotalSpaces
            title="Total Spaces"
            value={systemMetrics.totalSpaces}
            description="Managed spaces"
            trend={{ value: 5, isPositive: true }}
          />

          <CommonMetrics.Revenue
            title="Monthly Revenue"
            value={`$${systemMetrics.monthlyRevenue.toLocaleString()}`}
            description="Current month"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricWidget
            title="System Uptime"
            value={systemMetrics.systemUptime}
            description="Last 30 days"
            icon={<Shield className="h-4 w-4" />}
          />

          <CommonMetrics.ActiveSessions
            title="Active Connections"
            value={systemMetrics.activeConnections}
            description="Current sessions"
          />

          <MetricWidget
            title="Storage Used"
            value={systemMetrics.storageUsed}
            description="Of 500 GB total"
            icon={<Database className="h-4 w-4" />}
          />

          <CommonMetrics.TotalBookings
            title="Total Bookings"
            value={systemMetrics.totalBookings.toLocaleString()}
            description="This month"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TenantManagementFeature>
              <QuickActionWidget
                title="Tenant Management"
                description="Create and manage coworking spaces"
                icon={<Building2 className="h-6 w-6" />}
                onClick={handleCreateTenant}
              />
            </TenantManagementFeature>

            <QuickActionWidget
              title="System Analytics"
              description="View platform-wide analytics"
              icon={<BarChart3 className="h-6 w-6" />}
              onClick={handleViewAnalytics}
            />

            <QuickActionWidget
              title="User Management"
              description="Manage users across all tenants"
              icon={<Users className="h-6 w-6" />}
              onClick={handleManageUsers}
            />

            <SystemSettingsFeature>
              <QuickActionWidget
                title="System Settings"
                description="Configure platform settings"
                icon={<Settings className="h-6 w-6" />}
                onClick={handleSystemSettings}
              />
            </SystemSettingsFeature>

            <QuickActionWidget
              title="System Logs"
              description="View system logs and errors"
              icon={<Eye className="h-6 w-6" />}
              onClick={handleViewLogs}
            />

            <QuickActionWidget
              title="Backup Management"
              description="Manage system backups"
              icon={<Wrench className="h-6 w-6" />}
              onClick={handleBackupManagement}
            />
          </div>
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Platform Growth"
            description="User and tenant growth over time"
          >
            <div className="h-64 flex items-center justify-center text-gray-500">
              {/* Placeholder for chart - would integrate with charting library */}
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with Chart.js or Recharts</p>
              </div>
            </div>
          </ChartWidget>

          <ActivityFeedWidget
            activities={recentActivity}
            title="System Activity"
            maxItems={6}
          />
        </div>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Storage Warning</p>
                    <p className="text-sm text-gray-600">
                      File storage is at 85% capacity
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Resolve
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Scheduled Maintenance</p>
                    <p className="text-sm text-gray-600">
                      Database maintenance in 2 days
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}
