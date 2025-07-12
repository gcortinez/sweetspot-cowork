"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Users,
  MapPin,
  DollarSign,
  Clock,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { CoworkAdminOnly } from "@/components/rbac/role-gate";

interface Space {
  id: string;
  name: string;
  type: "private_office" | "meeting_room" | "hot_desk" | "conference_room" | "phone_booth";
  capacity: number;
  hourlyRate: number;
  monthlyRate?: number;
  status: "available" | "occupied" | "maintenance" | "disabled";
  amenities: string[];
  location: string;
  bookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  occupancyRate: number;
  revenue: {
    today: number;
    thisMonth: number;
  };
}

const SpacesManagementPage: React.FC = () => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Mock data
  const [spaces] = useState<Space[]>([
    {
      id: "1",
      name: "Oficina Ejecutiva A",
      type: "private_office",
      capacity: 4,
      hourlyRate: 25,
      monthlyRate: 1200,
      status: "available",
      amenities: ["wifi", "projector", "whiteboard", "coffee"],
      location: "Piso 2, Zona Norte",
      bookings: { today: 2, thisWeek: 12, thisMonth: 45 },
      occupancyRate: 75,
      revenue: { today: 200, thisMonth: 5400 },
    },
    {
      id: "2",
      name: "Sala de Reuniones B",
      type: "meeting_room",
      capacity: 8,
      hourlyRate: 15,
      status: "occupied",
      amenities: ["wifi", "projector", "video_call"],
      location: "Piso 1, Centro",
      bookings: { today: 6, thisWeek: 28, thisMonth: 89 },
      occupancyRate: 85,
      revenue: { today: 360, thisMonth: 2670 },
    },
    {
      id: "3",
      name: "Hot Desk 12",
      type: "hot_desk",
      capacity: 1,
      hourlyRate: 8,
      status: "available",
      amenities: ["wifi", "power"],
      location: "Piso 1, Zona Sur",
      bookings: { today: 1, thisWeek: 8, thisMonth: 32 },
      occupancyRate: 60,
      revenue: { today: 24, thisMonth: 768 },
    },
    {
      id: "4",
      name: "Cabina Telefónica 1",
      type: "phone_booth",
      capacity: 1,
      hourlyRate: 5,
      status: "maintenance",
      amenities: ["wifi", "soundproof"],
      location: "Piso 1, Entrada",
      bookings: { today: 0, thisWeek: 0, thisMonth: 15 },
      occupancyRate: 25,
      revenue: { today: 0, thisMonth: 75 },
    },
    {
      id: "5",
      name: "Sala de Conferencias Principal",
      type: "conference_room",
      capacity: 20,
      hourlyRate: 50,
      status: "available",
      amenities: ["wifi", "projector", "video_call", "catering", "sound_system"],
      location: "Piso 3, Centro",
      bookings: { today: 1, thisWeek: 4, thisMonth: 18 },
      occupancyRate: 40,
      revenue: { today: 100, thisMonth: 2250 },
    },
  ]);

  const spaceTypes = [
    { value: "all", label: t("spaces.allTypes") },
    { value: "private_office", label: t("spaces.privateOffice") },
    { value: "meeting_room", label: t("spaces.meetingRoom") },
    { value: "hot_desk", label: t("spaces.hotDesk") },
    { value: "conference_room", label: t("spaces.conferenceRoom") },
    { value: "phone_booth", label: t("spaces.phoneBooth") },
  ];

  const spaceStatuses = [
    { value: "all", label: t("spaces.allStatuses") },
    { value: "available", label: t("spaces.available") },
    { value: "occupied", label: t("spaces.occupied") },
    { value: "maintenance", label: t("spaces.maintenance") },
    { value: "disabled", label: t("spaces.disabled") },
  ];

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || space.type === selectedType;
    const matchesStatus = selectedStatus === "all" || space.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "disabled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      private_office: t("spaces.privateOffice"),
      meeting_room: t("spaces.meetingRoom"),
      hot_desk: t("spaces.hotDesk"),
      conference_room: t("spaces.conferenceRoom"),
      phone_booth: t("spaces.phoneBooth"),
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      available: t("spaces.available"),
      occupied: t("spaces.occupied"),
      maintenance: t("spaces.maintenance"),
      disabled: t("spaces.disabled"),
    };
    return statusMap[status] || status;
  };

  return (
    <CoworkAdminOnly>
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
                    {t("admin.manageSpaces")}
                  </h1>
                  <p className="text-sm sm:text-body text-gray-600 mt-1">
                    {t("admin.manageSpacesDesc")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("spaces.newSpace")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Filters */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("spaces.searchSpaces")}
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
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {spaceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    {spaceStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Spaces Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <Card key={space.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getTypeLabel(space.type)}</Badge>
                      <Badge className={getStatusColor(space.status)}>
                        {getStatusLabel(space.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{t("spaces.capacity")}: {space.capacity} {t("spaces.people")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{space.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      ${space.hourlyRate}/{t("spaces.hourly")}
                      {space.monthlyRate && ` • $${space.monthlyRate}/${t("spaces.monthly")}`}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {space.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {space.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{space.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">{t("spaces.occupancy")}</p>
                    <p className="text-sm font-semibold text-gray-900">{space.occupancyRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("spaces.revenue")}/{t("spaces.monthly")}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ${space.revenue.thisMonth.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("spaces.bookingsToday")}</p>
                    <p className="text-sm font-semibold text-gray-900">{space.bookings.today}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("spaces.bookingsMonth")}</p>
                    <p className="text-sm font-semibold text-gray-900">{space.bookings.thisMonth}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredSpaces.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("spaces.noSpacesFound")}</h3>
              <p className="text-gray-600 mb-6">
                {t("spaces.noSpacesMessage")}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("spaces.createFirstSpace")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </CoworkAdminOnly>
  );
};

export default SpacesManagementPage;