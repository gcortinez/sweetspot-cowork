"use client";

import { useState, useEffect } from "react";
import {
  MetricWidget,
  QuickActionWidget,
  ActivityFeedWidget,
  ChartWidget,
  CommonMetrics,
} from "./dashboard-widgets";
import { CoworkAdminOnly } from "@/components/rbac/role-gate";
import {
  UserManagementFeature,
  BillingFeature,
} from "@/components/rbac/feature-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  UserPlus,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Zap,
} from "lucide-react";

interface CoworkAdminDashboardProps {
  className?: string;
}

export function CoworkAdminDashboard({
  className = "",
}: CoworkAdminDashboardProps) {
  const [tenantMetrics, setTenantMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalSpaces: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    todayBookings: 0,
    utilizationRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: "1",
      title: "New member joined",
      description: "Sarah Johnson signed up for Premium plan",
      timestamp: "5 minutes ago",
      type: "member" as const,
    },
    {
      id: "2",
      title: "Space booking confirmed",
      description: "Conference Room A booked for tomorrow",
      timestamp: "15 minutes ago",
      type: "booking" as const,
    },
    {
      id: "3",
      title: "Payment received",
      description: "$299 monthly subscription from TechCorp",
      timestamp: "1 hour ago",
      type: "payment" as const,
    },
    {
      id: "4",
      title: "Space maintenance scheduled",
      description: "Cleaning service for Hot Desk Area B",
      timestamp: "2 hours ago",
      type: "space" as const,
    },
  ]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setTenantMetrics({
      totalMembers: 156,
      activeMembers: 89,
      totalSpaces: 12,
      occupancyRate: 78,
      monthlyRevenue: 18500,
      pendingBookings: 7,
      todayBookings: 23,
      utilizationRate: 85,
    });
  }, []);

  const handleAddMember = () => {
    console.log("Navigate to add member");
  };

  const handleManageSpaces = () => {
    console.log("Navigate to space management");
  };

  const handleViewBookings = () => {
    console.log("Navigate to booking management");
  };

  const handleViewReports = () => {
    console.log("Navigate to reports");
  };

  const handleBillingSettings = () => {
    console.log("Navigate to billing settings");
  };

  const handleTenantSettings = () => {
    console.log("Navigate to tenant settings");
  };

  return (
    <CoworkAdminOnly>
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cowork Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your coworking space operations
            </p>
          </div>
          <UserManagementFeature>
            <Button
              onClick={handleAddMember}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </UserManagementFeature>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CommonMetrics.TotalUsers
            title="Total Members"
            value={tenantMetrics.totalMembers}
            description={`${tenantMetrics.activeMembers} active today`}
            trend={{ value: 8, isPositive: true }}
          />

          <CommonMetrics.TotalSpaces
            title="Available Spaces"
            value={tenantMetrics.totalSpaces}
            description="Managed spaces"
            trend={{ value: 2, isPositive: true }}
          />

          <CommonMetrics.Occupancy
            title="Occupancy Rate"
            value={`${tenantMetrics.occupancyRate}%`}
            description="Current utilization"
            trend={{ value: 5, isPositive: true }}
          />

          <CommonMetrics.Revenue
            title="Monthly Revenue"
            value={`$${tenantMetrics.monthlyRevenue.toLocaleString()}`}
            description="Current month"
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CommonMetrics.TotalBookings
            title="Today's Bookings"
            value={tenantMetrics.todayBookings}
            description="Scheduled for today"
          />

          <MetricWidget
            title="Pending Approvals"
            value={tenantMetrics.pendingBookings}
            description="Require your attention"
            icon={<Clock className="h-4 w-4" />}
          />

          <MetricWidget
            title="Space Utilization"
            value={`${tenantMetrics.utilizationRate}%`}
            description="Average this week"
            icon={<TrendingUp className="h-4 w-4" />}
          />

          <MetricWidget
            title="Active Sessions"
            value={tenantMetrics.activeMembers}
            description="Members checked in"
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UserManagementFeature>
              <QuickActionWidget
                title="Member Management"
                description="Add, edit, and manage members"
                icon={<Users className="h-6 w-6" />}
                onClick={handleAddMember}
              />
            </UserManagementFeature>

            <QuickActionWidget
              title="Space Management"
              description="Configure spaces and amenities"
              icon={<Building className="h-6 w-6" />}
              onClick={handleManageSpaces}
            />

            <QuickActionWidget
              title="Booking Overview"
              description="View and manage reservations"
              icon={<Calendar className="h-6 w-6" />}
              onClick={handleViewBookings}
            />

            <QuickActionWidget
              title="Analytics & Reports"
              description="View usage and financial reports"
              icon={<BarChart3 className="h-6 w-6" />}
              onClick={handleViewReports}
            />

            <BillingFeature>
              <QuickActionWidget
                title="Billing Settings"
                description="Manage pricing and payments"
                icon={<DollarSign className="h-6 w-6" />}
                onClick={handleBillingSettings}
              />
            </BillingFeature>

            <QuickActionWidget
              title="Tenant Settings"
              description="Configure workspace settings"
              icon={<Settings className="h-6 w-6" />}
              onClick={handleTenantSettings}
            />
          </div>
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Space Utilization Trends"
            description="Occupancy rates over the last 30 days"
          >
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Utilization chart would go here</p>
                <p className="text-sm">Shows peak hours and space usage</p>
              </div>
            </div>
          </ChartWidget>

          <ActivityFeedWidget
            activities={recentActivity}
            title="Recent Activity"
            maxItems={6}
          />
        </div>

        {/* Today's Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Team Meeting</p>
                      <p className="text-sm text-gray-600">
                        Conference Room A • 10:00 AM
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    In Progress
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Workshop Setup</p>
                      <p className="text-sm text-gray-600">
                        Event Space • 2:00 PM
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Upcoming
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">New Member Tour</p>
                      <p className="text-sm text-gray-600">
                        Reception • 4:00 PM
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Scheduled
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Payment Overdue</p>
                      <p className="text-xs text-gray-600">
                        TechCorp subscription payment is 3 days overdue
                      </p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Maintenance Request</p>
                      <p className="text-xs text-gray-600">
                        Hot Desk Area B needs cleaning service
                      </p>
                      <p className="text-xs text-gray-400 mt-1">4 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">
                        New Member Application
                      </p>
                      <p className="text-xs text-gray-600">
                        Sarah Johnson applied for Premium membership
                      </p>
                      <p className="text-xs text-gray-400 mt-1">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoworkAdminOnly>
  );
}
