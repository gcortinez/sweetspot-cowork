"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import {
  Calendar,
  Users,
  Building2,
  Settings,
  BarChart3,
  Plus,
  Home,
  CreditCard,
  User,
  Bell,
  HelpCircle,
  LogOut,
  UserCheck,
  Target,
  Activity,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

const getNavigationItems = (t: (key: string) => string) => [
  {
    title: t("nav.dashboard"),
    href: "/dashboard",
    icon: Home,
  },
  {
    title: t("nav.spaces"),
    href: "/spaces",
    icon: Building2,
  },
  {
    title: t("nav.bookings"),
    href: "/bookings",
    icon: Calendar,
  },
  {
    title: t("nav.members"),
    href: "/members",
    icon: Users,
  },
  {
    title: t("nav.analytics"),
    href: "/analytics",
    icon: BarChart3,
  },
];

const getAccountItems = (t: (key: string) => string) => [
  {
    title: t("nav.profile"),
    href: "/profile",
    icon: User,
  },
  {
    title: t("nav.billing"),
    href: "/billing",
    icon: CreditCard,
  },
  {
    title: t("nav.notifications"),
    href: "/notifications",
    icon: Bell,
  },
  {
    title: t("nav.settings"),
    href: "/settings",
    icon: Settings,
  },
];

const getCrmItems = (t: (key: string) => string) => [
  {
    title: t("nav.leads"),
    href: "/leads",
    icon: UserCheck,
  },
  {
    title: t("nav.opportunities"),
    href: "/opportunities",
    icon: Target,
  },
  {
    title: t("nav.activities"),
    href: "/activities",
    icon: Activity,
  },
  {
    title: t("nav.conversions"),
    href: "/conversions",
    icon: ArrowRightLeft,
  },
];

const getSupportItems = (t: (key: string) => string) => [
  {
    title: t("nav.help"),
    href: "/help",
    icon: HelpCircle,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ className, onCloseMobile }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNewBooking = () => {
    toast({
      title: "Funcionalidad próximamente disponible",
      description: "La funcionalidad de nueva reserva estará disponible en una próxima actualización",
    });
  };

  const navigationItems = getNavigationItems(t);
  const crmItems = getCrmItems(t);
  const accountItems = getAccountItems(t);
  const supportItems = getSupportItems(t);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 shadow-sm",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            SweetSpot
          </span>
        </Link>
      </div>

      {/* Create Button */}
      <div className="p-4 border-b border-gray-100">
        <Button
          className="w-full justify-start gap-3 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          onClick={handleNewBooking}
        >
          <Plus className="h-4 w-4" />
          {t("action.newBooking")}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* CRM Section */}
        <div className="mt-8">
          <div className="px-6 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("section.crm")}
            </h3>
          </div>
          <nav className="space-y-1 px-3">
            {crmItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account Section */}
        <div className="mt-8">
          <div className="px-6 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("section.account")}
            </h3>
          </div>
          <nav className="space-y-1 px-3">
            {accountItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Section */}
        <div className="mt-8">
          <div className="px-6 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("section.support")}
            </h3>
          </div>
          <nav className="space-y-1 px-3">
            {supportItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Language Selector and User Profile */}
      <div className="border-t border-gray-200 bg-white">
        {/* Language Selector */}
        <div className="p-3">
          <LanguageSelector />
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-sm font-semibold text-white">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.email || "User"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {t(`role.${user?.role}`) || t("role.Guest")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors p-2 rounded-lg"
              title={isLoggingOut ? t("action.loggingOut") : t("action.logout")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
