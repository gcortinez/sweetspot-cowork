"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  Edit,
  Eye,
  Settings,
  Building2,
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  
  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">{t("nav.profile")}</h1>
              <p className="text-sm sm:text-body text-gray-600 mt-1">
                {t("profile.manageAccount")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                {t("profile.viewPublic")}
              </Button>
              <Link href="/profile/edit">
                <Button className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("profile.editProfile")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Profile Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg mb-4">
                  <span className="text-2xl font-semibold text-white">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                
                {/* User Info */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {user?.email || "Usuario"}
                </h2>
                
                <Badge className="mb-4">
                  {t(`role.${user?.role}`) || t("role.Guest")}
                </Badge>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">12</p>
                    <p className="text-sm text-gray-600">{t("profile.totalBookings")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">8</p>
                    <p className="text-sm text-gray-600">{t("profile.thisMonth")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">4.9</p>
                    <p className="text-sm text-gray-600">{t("profile.rating")}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("profile.personalInfo")}
                </h3>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("auth.email")}</p>
                    <p className="font-medium text-gray-900">{user?.email || "No definido"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("profile.phone")}</p>
                    <p className="font-medium text-gray-900">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("profile.location")}</p>
                    <p className="font-medium text-gray-900">Ciudad de México, México</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("profile.memberSince")}</p>
                    <p className="font-medium text-gray-900">Enero 2024</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("profile.workspace")}</p>
                    <p className="font-medium text-gray-900">SweetSpot HQ</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("profile.billing")}</h4>
                <p className="text-sm text-gray-600">{t("profile.manageBilling")}</p>
              </div>
            </div>
            <Link href="/profile/billing">
              <Button variant="ghost" className="w-full mt-4 justify-start">
                {t("profile.viewBilling")}
              </Button>
            </Link>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("profile.notifications")}</h4>
                <p className="text-sm text-gray-600">{t("profile.manageNotifications")}</p>
              </div>
            </div>
            <Link href="/profile/notifications">
              <Button variant="ghost" className="w-full mt-4 justify-start">
                {t("profile.configure")}
              </Button>
            </Link>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("profile.security")}</h4>
                <p className="text-sm text-gray-600">{t("profile.manageSecurity")}</p>
              </div>
            </div>
            <Link href="/profile/security">
              <Button variant="ghost" className="w-full mt-4 justify-start">
                {t("profile.viewSecurity")}
              </Button>
            </Link>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("profile.preferences")}</h4>
                <p className="text-sm text-gray-600">{t("profile.managePreferences")}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 justify-start">
              {t("profile.configure")}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;