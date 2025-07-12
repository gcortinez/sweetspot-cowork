"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building,
  Calendar,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  UserCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Overview and quick actions",
  },
  {
    href: "/spaces",
    label: "Spaces",
    icon: Building,
    description: "Browse and book workspaces",
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: Calendar,
    description: "Manage your reservations",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    description: "Account settings and preferences",
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Admin Dashboard",
    icon: BarChart3,
    description: "System overview and analytics",
  },
  {
    href: "/admin/spaces",
    label: "Manage Spaces",
    icon: Building,
    description: "Configure workspaces and amenities",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    description: "Member management and permissions",
  },
  {
    href: "/admin/bookings",
    label: "All Bookings",
    icon: Calendar,
    description: "View and manage all reservations",
  },
  {
    href: "/admin/billing",
    label: "Billing",
    icon: CreditCard,
    description: "Payments and subscription management",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "System configuration and preferences",
  },
];

const CLIENT_ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Overview and quick actions",
  },
  {
    href: "/spaces",
    label: "Spaces",
    icon: Building,
    description: "Browse and book workspaces",
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: Calendar,
    description: "Manage your reservations",
  },
  {
    href: "/team",
    label: "Team",
    icon: Users,
    description: "Manage team members and permissions",
  },
  {
    href: "/billing",
    label: "Billing",
    icon: CreditCard,
    description: "Invoices and payment methods",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
    description: "Account settings and preferences",
  },
];

interface MainNavProps {
  className?: string;
  variant?: "sidebar" | "horizontal";
  showLabels?: boolean;
}

export function MainNav({
  className,
  variant = "sidebar",
  showLabels = true,
}: MainNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Determine navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return DEFAULT_NAV_ITEMS;

    switch (user.role) {
      case "SUPER_ADMIN":
      case "COWORK_ADMIN":
        return ADMIN_NAV_ITEMS;
      case "CLIENT_ADMIN":
        return CLIENT_ADMIN_NAV_ITEMS;
      case "END_USER":
      default:
        return DEFAULT_NAV_ITEMS;
    }
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (variant === "horizontal") {
    return (
      <nav className={cn("flex items-center space-x-1", className)}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-6 text-body font-medium transition-all duration-150 ease-out",
                "hover:bg-neutral-50 dark:hover:bg-dark-bg-tertiary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2",
                active
                  ? "bg-brand-blue-pale text-brand-blue border border-brand-blue/20"
                  : "text-neutral-600 dark:text-dark-text-secondary hover:text-neutral-900 dark:hover:text-dark-text-primary"
              )}
              title={item.description}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {showLabels && (
                <span className="hidden sm:inline">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-6 text-body font-medium transition-all duration-150 ease-out",
              "hover:bg-neutral-50 dark:hover:bg-dark-bg-tertiary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2",
              active
                ? "bg-brand-blue text-white shadow-sm"
                : "text-neutral-600 dark:text-dark-text-secondary hover:text-neutral-900 dark:hover:text-dark-text-primary"
            )}
            title={item.description}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-150",
                active
                  ? "text-white"
                  : "text-neutral-500 group-hover:text-neutral-700",
                "group-hover:scale-105"
              )}
            />
            {showLabels && (
              <div className="flex flex-col min-w-0">
                <span className="truncate">{item.label}</span>
                {item.description && !active && (
                  <span className="text-caption text-neutral-400 dark:text-dark-text-secondary truncate">
                    {item.description}
                  </span>
                )}
              </div>
            )}
            {active && (
              <div className="ml-auto w-1 h-1 rounded-full bg-white opacity-75" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Specific navigation components for different user roles
export function EndUserNav(props: Omit<MainNavProps, "variant">) {
  return <MainNav {...props} />;
}

export function ClientAdminNav(props: Omit<MainNavProps, "variant">) {
  return <MainNav {...props} />;
}

export function AdminNav(props: Omit<MainNavProps, "variant">) {
  return <MainNav {...props} />;
}
