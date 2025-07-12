"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  X,
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  MapPin,
  User,
  Zap,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  spaceName: string;
  spaceType: "private_office" | "meeting_room" | "hot_desk" | "conference_room" | "phone_booth";
  memberName: string;
  memberEmail: string;
  startTime: string;
  endTime: string;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "in_progress";
  totalAmount: number;
  duration: number; // in hours
  notes?: string;
  memberType: "basic" | "premium" | "enterprise" | "day_pass";
  spaceCapacity: number;
  actualAttendees?: number;
}

const BookingsOversightPage: React.FC = () => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSpaceType, setSelectedSpaceType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("today");

  // Mock data
  const [bookings] = useState<Booking[]>([
    {
      id: "BK001",
      spaceName: "Oficina Ejecutiva A",
      spaceType: "private_office",
      memberName: "María García",
      memberEmail: "maria.garcia@empresa.com",
      startTime: "09:00",
      endTime: "11:00",
      date: "2024-12-14",
      status: "in_progress",
      totalAmount: 50,
      duration: 2,
      memberType: "premium",
      spaceCapacity: 4,
      actualAttendees: 3,
      notes: "Reunión de presupuesto Q1 2025",
    },
    {
      id: "BK002",
      spaceName: "Sala de Reuniones B",
      spaceType: "meeting_room",
      memberName: "Carlos López",
      memberEmail: "carlos.lopez@startup.io",
      startTime: "14:00",
      endTime: "16:00",
      date: "2024-12-14",
      status: "confirmed",
      totalAmount: 30,
      duration: 2,
      memberType: "enterprise",
      spaceCapacity: 8,
      actualAttendees: 6,
    },
    {
      id: "BK003",
      spaceName: "Hot Desk 12",
      spaceType: "hot_desk",
      memberName: "Ana Martínez",
      memberEmail: "ana.martinez@freelance.com",
      startTime: "08:00",
      endTime: "17:00",
      date: "2024-12-14",
      status: "completed",
      totalAmount: 72,
      duration: 9,
      memberType: "basic",
      spaceCapacity: 1,
      actualAttendees: 1,
    },
    {
      id: "BK004",
      spaceName: "Sala de Conferencias Principal",
      spaceType: "conference_room",
      memberName: "Roberto Silva",
      memberEmail: "roberto.silva@corp.com",
      startTime: "10:00",
      endTime: "12:00",
      date: "2024-12-15",
      status: "pending",
      totalAmount: 100,
      duration: 2,
      memberType: "premium",
      spaceCapacity: 20,
      notes: "Presentación trimestral - Requiere catering",
    },
    {
      id: "BK005",
      spaceName: "Cabina Telefónica 1",
      spaceType: "phone_booth",
      memberName: "Lucía Fernández",
      memberEmail: "lucia.fernandez@design.studio",
      startTime: "13:30",
      endTime: "14:30",
      date: "2024-12-13",
      status: "cancelled",
      totalAmount: 5,
      duration: 1,
      memberType: "day_pass",
      spaceCapacity: 1,
    },
    {
      id: "BK006",
      spaceName: "Oficina Ejecutiva B",
      spaceType: "private_office",
      memberName: "Diego Ramírez",
      memberEmail: "diego.ramirez@tech.com",
      startTime: "16:00",
      endTime: "18:00",
      date: "2024-12-14",
      status: "confirmed",
      totalAmount: 50,
      duration: 2,
      memberType: "enterprise",
      spaceCapacity: 4,
      actualAttendees: 2,
    },
  ]);

  const statusOptions = [
    { value: "all", label: t("bookings.allStatuses") },
    { value: "confirmed", label: t("bookings.confirmed") },
    { value: "pending", label: t("bookings.pending") },
    { value: "in_progress", label: t("bookings.inProgress") },
    { value: "completed", label: t("bookings.completed") },
    { value: "cancelled", label: t("bookings.cancelled") },
  ];

  const spaceTypeOptions = [
    { value: "all", label: t("bookings.allSpaces") },
    { value: "private_office", label: t("spaces.privateOffice") },
    { value: "meeting_room", label: t("spaces.meetingRoom") },
    { value: "hot_desk", label: t("spaces.hotDesk") },
    { value: "conference_room", label: t("spaces.conferenceRoom") },
    { value: "phone_booth", label: t("spaces.phoneBooth") },
  ];

  const dateOptions = [
    { value: "today", label: t("bookings.today") },
    { value: "tomorrow", label: t("bookings.tomorrow") },
    { value: "week", label: t("bookings.thisWeek") },
    { value: "month", label: t("bookings.thisMonth") },
    { value: "all", label: t("bookings.allDates") },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus;
    const matchesSpaceType = selectedSpaceType === "all" || booking.spaceType === selectedSpaceType;
    
    // Simple date filtering (in a real app, this would be more sophisticated)
    let matchesDate = true;
    if (selectedDate === "today") {
      matchesDate = booking.date === "2024-12-14";
    } else if (selectedDate === "tomorrow") {
      matchesDate = booking.date === "2024-12-15";
    }
    
    return matchesSearch && matchesStatus && matchesSpaceType && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: t("bookings.confirmed"),
      pending: t("bookings.pending"),
      in_progress: t("bookings.inProgress"),
      completed: t("bookings.completed"),
      cancelled: t("bookings.cancelled"),
    };
    return statusMap[status] || status;
  };

  const getSpaceTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      private_office: t("spaces.privateOffice"),
      meeting_room: t("spaces.meetingRoom"),
      hot_desk: t("spaces.hotDesk"),
      conference_room: t("spaces.conferenceRoom"),
      phone_booth: t("spaces.phoneBooth"),
    };
    return typeMap[type] || type;
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const totalBookings = filteredBookings.length;
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const averageOccupancy = filteredBookings.length > 0 
    ? Math.round(filteredBookings.reduce((sum, b) => {
        if (b.actualAttendees && b.spaceCapacity) {
          return sum + (b.actualAttendees / b.spaceCapacity * 100);
        }
        return sum;
      }, 0) / filteredBookings.filter(b => b.actualAttendees).length) 
    : 0;

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
                  {t("admin.manageBookings")}
                </h1>
                <p className="text-sm sm:text-body text-gray-600 mt-1">
                  {t("admin.manageBookingsDesc")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("bookings.reports")}
              </Button>
              <Button className="w-full sm:w-auto">
                <Calendar className="h-4 w-4 mr-2" />
                {t("bookings.newBooking")}
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
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                <p className="text-sm text-gray-600">{t("bookings.totalBookings")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{confirmedBookings}</p>
                <p className="text-sm text-gray-600">{t("bookings.confirmedBookings")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
                <p className="text-sm text-gray-600">{t("bookings.pendingBookings")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                <p className="text-sm text-gray-600">{t("bookings.revenue")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Occupancy Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("bookings.averageOccupancy")}</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">{averageOccupancy}%</div>
              <div className="text-sm text-gray-600">
                {t("bookings.capacityUtilized")}
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("bookings.efficiency")}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("bookings.completedBookings")}</span>
                <span className="font-medium">{bookings.filter(b => b.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("bookings.cancellations")}</span>
                <span className="font-medium text-red-600">{bookings.filter(b => b.status === 'cancelled').length}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t("bookings.mostUsedSpaces")}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("bookings.privateOffices")}</span>
                <span className="font-medium">{bookings.filter(b => b.spaceType === 'private_office').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("bookings.meetingRooms")}</span>
                <span className="font-medium">{bookings.filter(b => b.spaceType === 'meeting_room').length}</span>
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
                  placeholder={t("bookings.searchBookings")}
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
                  value={selectedSpaceType}
                  onChange={(e) => setSelectedSpaceType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {spaceTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dateOptions.map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.booking")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.space")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.member")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.schedule")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.occupancy")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{booking.id}</div>
                        <div className="text-sm text-gray-500">{formatDate(booking.date)}</div>
                        <div className="text-sm text-gray-500">${booking.totalAmount}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.spaceName}</div>
                          <div className="text-sm text-gray-500">{getSpaceTypeLabel(booking.spaceType)}</div>
                          <div className="text-sm text-gray-500">{t("bookings.capacity")} {booking.spaceCapacity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mr-3">
                          <span className="text-xs font-semibold text-white">
                            {booking.memberName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.memberName}</div>
                          <div className="text-sm text-gray-500">{booking.memberEmail}</div>
                          <Badge variant="outline" className="text-xs">
                            {booking.memberType}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                        <div className="text-gray-400">{booking.duration}h {t("bookings.duration")}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.actualAttendees ? (
                        <div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{booking.actualAttendees}/{booking.spaceCapacity}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {Math.round((booking.actualAttendees / booking.spaceCapacity) * 100)}% {t("bookings.occupied")}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          {booking.status === 'pending' ? t("bookings.pending") : t("bookings.notAvailable")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("bookings.noBookingsFound")}</h3>
            <p className="text-gray-600 mb-6">
              {t("bookings.noBookingsMessage")}
            </p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              {t("bookings.createFirstBooking")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsOversightPage;