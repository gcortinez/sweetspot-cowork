"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  Eye,
  UserPlus,
  Shield,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import {
  SuperAdminOnly,
  CoworkAdminOnly,
  ClientAdminOnly,
} from "@/components/rbac/role-gate";
import { useActionPermissions } from "@/hooks/use-rbac";

const AdminPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const actionPermissions = useActionPermissions();

  // Mock data - en una aplicación real vendría de la API
  const stats = {
    totalSpaces: 24,
    occupiedSpaces: 18,
    totalMembers: 248,
    activeMembers: 234,
    todayBookings: 32,
    pendingBookings: 5,
    monthlyRevenue: 45650,
    revenueGrowth: 12.5,
  };

  const recentActivity = [
    {
      id: 1,
      type: "booking",
      user: "María García",
      action: "Reservó Sala de Reuniones A",
      time: "Hace 5 min",
      status: "confirmed",
    },
    {
      id: 2,
      type: "member",
      user: "Carlos López",
      action: "Se registró como nuevo miembro",
      time: "Hace 15 min",
      status: "pending",
    },
    {
      id: 3,
      type: "payment",
      user: "Ana Martínez",
      action: "Completó pago mensual",
      time: "Hace 30 min",
      status: "completed",
    },
    {
      id: 4,
      type: "space",
      user: "Sistema",
      action: "Oficina Privada 3 liberada",
      time: "Hace 1 hora",
      status: "info",
    },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      title: "Mantenimiento Programado",
      message: "Sala de Reuniones B requiere mantenimiento mañana 9-11 AM",
      urgent: false,
    },
    {
      id: 2,
      type: "error",
      title: "Pago Fallido",
      message: "3 miembros tienen pagos pendientes este mes",
      urgent: true,
    },
    {
      id: 3,
      type: "info",
      title: "Capacidad Alta",
      message: "85% de ocupación - considera abrir más espacios",
      urgent: false,
    },
  ];

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                {t("admin.dashboard")}
              </h1>
              <p className="text-sm sm:text-body text-gray-600 mt-1">
                {t("admin.welcomeMessage")} {user?.email}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("admin.viewReports")}
              </Button>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.quickAdd")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.occupiedSpaces}/{stats.totalSpaces}
                </p>
                <p className="text-sm text-gray-600">{t("admin.spacesOccupied")}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500">
                    {Math.round((stats.occupiedSpaces / stats.totalSpaces) * 100)}% {t("admin.utilization")}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeMembers}/{stats.totalMembers}
                </p>
                <p className="text-sm text-gray-600">{t("admin.activeMembers")}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">94% {t("admin.active")}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
                <p className="text-sm text-gray-600">{t("admin.todayBookings")}</p>
                {stats.pendingBookings > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-orange-600">
                      {stats.pendingBookings} {t("admin.pending")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{t("admin.monthlyRevenue")}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600">+{stats.revenueGrowth}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("admin.alerts")}
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.type === "error"
                      ? "bg-red-50 border-red-200"
                      : alert.type === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {alert.type === "error" ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : alert.type === "warning" ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${
                          alert.type === "error"
                            ? "text-red-900"
                            : alert.type === "warning"
                            ? "text-yellow-900"
                            : "text-blue-900"
                        }`}>
                          {alert.title}
                        </h4>
                        {alert.urgent && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            {t("admin.urgent")}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        alert.type === "error"
                          ? "text-red-700"
                          : alert.type === "warning"
                          ? "text-yellow-700"
                          : "text-blue-700"
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {t("admin.quickActions")}
              </h3>
              <div className="space-y-3">
                {/* Space Management */}
                <CoworkAdminOnly>
                  <Link href="/admin/spaces">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-50 group-hover:bg-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-gray-700">
                          {t("admin.manageSpaces")}
                        </p>
                        <p className="text-sm text-gray-600">{t("admin.manageSpacesDesc")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                </CoworkAdminOnly>

                {/* Member Management */}
                <ClientAdminOnly>
                  <Link href="/admin/members">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-50 group-hover:bg-green-100">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-gray-700">
                          {t("admin.manageMembers")}
                        </p>
                        <p className="text-sm text-gray-600">{t("admin.manageMembersDesc")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                </ClientAdminOnly>

                {/* Booking Management */}
                <Link href="/admin/bookings">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-50 group-hover:bg-purple-100">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-gray-700">
                        {t("admin.manageBookings")}
                      </p>
                      <p className="text-sm text-gray-600">{t("admin.manageBookingsDesc")}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>

                {/* Billing Management */}
                <CoworkAdminOnly>
                  <Link href="/admin/billing">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-50 group-hover:bg-emerald-100">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-gray-700">
                          {t("admin.manageBilling")}
                        </p>
                        <p className="text-sm text-gray-600">{t("admin.manageBillingDesc")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                </CoworkAdminOnly>

                {/* System Settings */}
                <SuperAdminOnly>
                  <Link href="/admin/settings">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-orange-50 group-hover:bg-orange-100">
                        <Settings className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-gray-700">
                          {t("admin.systemSettings")}
                        </p>
                        <p className="text-sm text-gray-600">{t("admin.systemSettingsDesc")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                </SuperAdminOnly>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("admin.recentActivity")}
                </h3>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  {t("admin.viewAll")}
                </Button>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      activity.type === "booking" ? "bg-purple-50" :
                      activity.type === "member" ? "bg-green-50" :
                      activity.type === "payment" ? "bg-blue-50" :
                      "bg-gray-50"
                    }`}>
                      {activity.type === "booking" ? (
                        <Calendar className="h-5 w-5 text-purple-600" />
                      ) : activity.type === "member" ? (
                        <Users className="h-5 w-5 text-green-600" />
                      ) : activity.type === "payment" ? (
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{activity.time}</p>
                      <Badge className={`text-xs ${
                        activity.status === "confirmed" ? "bg-green-100 text-green-800 border-green-200" :
                        activity.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        activity.status === "completed" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}>
                        {t(`status.${activity.status}`) || activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* User Role Info */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("admin.currentRole")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">{t("admin.accountDetails")}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t("auth.email")}:</span>
                  <span className="text-gray-600">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t("admin.role")}:</span>
                  <Badge>{t(`role.${user?.role}`) || user?.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t("admin.tenant")}:</span>
                  <span className="text-gray-600">{user?.tenantId}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t("admin.permissions")}</h4>
              <div className="grid grid-cols-1 gap-1 text-sm">
                {actionPermissions.canCreateUser && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("admin.canCreateUsers")}
                  </span>
                )}
                {actionPermissions.canViewReports && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("admin.canViewReports")}
                  </span>
                )}
                {actionPermissions.canViewBilling && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("admin.canViewBilling")}
                  </span>
                )}
                {actionPermissions.canAccessSystemSettings && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("admin.canAccessSettings")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;