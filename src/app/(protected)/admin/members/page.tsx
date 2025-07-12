"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Filter,
  MoreVertical,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import Link from "next/link";
import { ClientAdminOnly } from "@/components/rbac/role-gate";

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
  status: "active" | "inactive" | "suspended" | "pending";
  membershipType: "basic" | "premium" | "enterprise" | "day_pass";
  joinDate: string;
  lastActive: string;
  totalBookings: number;
  monthlySpend: number;
  tenantId: string;
  avatar?: string;
  subscription: {
    plan: string;
    status: "active" | "expired" | "cancelled";
    nextBilling?: string;
  };
}

const MembersManagementPage: React.FC = () => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMembership, setSelectedMembership] = useState<string>("all");

  // Mock data
  const [members] = useState<Member[]>([
    {
      id: "1",
      email: "maria.garcia@empresa.com",
      firstName: "María",
      lastName: "García",
      phone: "+52 555 123 4567",
      role: "END_USER",
      status: "active",
      membershipType: "premium",
      joinDate: "2024-01-15",
      lastActive: "2024-12-14T10:30:00Z",
      totalBookings: 45,
      monthlySpend: 850,
      tenantId: "tenant-1",
      subscription: {
        plan: "Premium Monthly",
        status: "active",
        nextBilling: "2024-12-20",
      },
    },
    {
      id: "2",
      email: "carlos.lopez@startup.io",
      firstName: "Carlos",
      lastName: "López",
      phone: "+52 555 987 6543",
      role: "CLIENT_ADMIN",
      status: "active",
      membershipType: "enterprise",
      joinDate: "2023-11-08",
      lastActive: "2024-12-14T09:15:00Z",
      totalBookings: 128,
      monthlySpend: 2400,
      tenantId: "tenant-2",
      subscription: {
        plan: "Enterprise Annual",
        status: "active",
        nextBilling: "2025-11-08",
      },
    },
    {
      id: "3",
      email: "ana.martinez@freelance.com",
      firstName: "Ana",
      lastName: "Martínez",
      role: "END_USER",
      status: "inactive",
      membershipType: "basic",
      joinDate: "2024-03-22",
      lastActive: "2024-12-10T16:45:00Z",
      totalBookings: 12,
      monthlySpend: 180,
      tenantId: "tenant-1",
      subscription: {
        plan: "Basic Monthly",
        status: "expired",
      },
    },
    {
      id: "4",
      email: "roberto.silva@corp.com",
      firstName: "Roberto",
      lastName: "Silva",
      phone: "+52 555 456 7890",
      role: "END_USER",
      status: "suspended",
      membershipType: "premium",
      joinDate: "2024-02-14",
      lastActive: "2024-12-05T14:20:00Z",
      totalBookings: 67,
      monthlySpend: 950,
      tenantId: "tenant-1",
      subscription: {
        plan: "Premium Monthly",
        status: "cancelled",
      },
    },
    {
      id: "5",
      email: "lucia.fernandez@design.studio",
      firstName: "Lucía",
      lastName: "Fernández",
      phone: "+52 555 321 0987",
      role: "END_USER",
      status: "pending",
      membershipType: "day_pass",
      joinDate: "2024-12-14",
      lastActive: "2024-12-14T08:00:00Z",
      totalBookings: 1,
      monthlySpend: 25,
      tenantId: "tenant-1",
      subscription: {
        plan: "Day Pass",
        status: "active",
      },
    },
  ]);

  const roleOptions = [
    { value: "all", label: t("members.allRoles") },
    { value: "SUPER_ADMIN", label: t("role.SUPER_ADMIN") },
    { value: "COWORK_ADMIN", label: t("role.COWORK_ADMIN") },
    { value: "CLIENT_ADMIN", label: t("role.CLIENT_ADMIN") },
    { value: "END_USER", label: t("role.END_USER") },
  ];

  const statusOptions = [
    { value: "all", label: t("members.allStatuses") },
    { value: "active", label: t("members.active") },
    { value: "inactive", label: t("members.inactive") },
    { value: "suspended", label: t("members.suspended") },
    { value: "pending", label: t("members.pending") },
  ];

  const membershipOptions = [
    { value: "all", label: t("members.allMemberships") },
    { value: "basic", label: t("members.basic") },
    { value: "premium", label: t("members.premium") },
    { value: "enterprise", label: t("members.enterprise") },
    { value: "day_pass", label: t("members.dayPass") },
  ];

  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || member.status === selectedStatus;
    const matchesMembership = selectedMembership === "all" || member.membershipType === selectedMembership;
    return matchesSearch && matchesRole && matchesStatus && matchesMembership;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "enterprise":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "premium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "basic":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "day_pass":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t("members.active"),
      inactive: t("members.inactive"),
      suspended: t("members.suspended"),
      pending: t("members.pending"),
    };
    return statusMap[status] || status;
  };

  const getMembershipLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      basic: t("members.basic"),
      premium: t("members.premium"),
      enterprise: t("members.enterprise"),
      day_pass: t("members.dayPass"),
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Hace menos de 1 hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return formatDate(dateString);
  };

  return (
    <ClientAdminOnly>
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
                    {t("admin.manageMembers")}
                  </h1>
                  <p className="text-sm sm:text-body text-gray-600 mt-1">
                    {t("admin.manageMembersDesc")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("members.inviteMember")}
                </Button>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("members.newMember")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-600">{t("members.totalMembers")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">{t("members.activeMembers")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600">{t("members.pendingMembers")}</p>
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
                    ${members.reduce((sum, m) => sum + m.monthlySpend, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">{t("members.monthlyRevenue")}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("members.searchMembers")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMembership}
                    onChange={(e) => setSelectedMembership(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {membershipOptions.map((membership) => (
                      <option key={membership.value} value={membership.value}>
                        {membership.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Members Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.member")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.roleAndStatus")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.membership")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.activity")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.billing")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("members.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant="outline">
                            {t(`role.${member.role}`)}
                          </Badge>
                          <Badge className={getStatusColor(member.status)}>
                            {getStatusLabel(member.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge className={getMembershipColor(member.membershipType)}>
                            {getMembershipLabel(member.membershipType)}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {member.subscription.plan}
                          </div>
                          <div className="text-xs text-gray-500">
                            Estado: {member.subscription.status}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>{t("members.lastSeen")}: {getRelativeTime(member.lastActive)}</div>
                          <div>{t("members.bookings")}: {member.totalBookings}</div>
                          <div>{t("members.since")}: {formatDate(member.joinDate)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            ${member.monthlySpend}/{t("spaces.monthly")}
                          </div>
                          {member.subscription.nextBilling && (
                            <div>
                              {t("members.nextBilling")}: {formatDate(member.subscription.nextBilling)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("members.noMembersFound")}</h3>
              <p className="text-gray-600 mb-6">
                {t("members.noMembersMessage")}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("members.addFirstMember")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ClientAdminOnly>
  );
};

export default MembersManagementPage;