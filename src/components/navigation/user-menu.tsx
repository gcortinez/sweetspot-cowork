"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Settings,
  User,
  Shield,
  Crown,
  Building,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useRoleAccess } from "@/contexts/auth-context";
import { RoleGate } from "@/components/rbac/role-gate";
import { FeatureToggle } from "@/components/rbac/feature-toggle";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

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

  const getRoleIcon = () => {
    if (isSuperAdmin) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (isCoworkAdmin) return <Shield className="h-4 w-4 text-blue-500" />;
    if (isClientAdmin) return <Building className="h-4 w-4 text-green-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isCoworkAdmin) return "Cowork Admin";
    if (isClientAdmin) return "Client Admin";
    return "End User";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-8 w-8 rounded-full ${className}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <div className="flex items-center space-x-2">
              {getRoleIcon()}
              <p className="text-xs leading-none text-muted-foreground">
                {getRoleLabel()}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Profile Settings */}
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Role-specific menu items */}
        <RoleGate minRole="CLIENT_ADMIN">
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Admin</DropdownMenuLabel>

          <FeatureToggle feature="user-management">
            <DropdownMenuItem onClick={() => router.push('/users')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Manage Users</span>
            </DropdownMenuItem>
          </FeatureToggle>

          <FeatureToggle feature="client-management">
            <DropdownMenuItem onClick={() => router.push('/clients')}>
              <Building className="mr-2 h-4 w-4" />
              <span>Manage Clients</span>
            </DropdownMenuItem>
          </FeatureToggle>

          <FeatureToggle feature="basic-reports">
            <DropdownMenuItem onClick={() => router.push('/reports')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </DropdownMenuItem>
          </FeatureToggle>
        </RoleGate>

        <RoleGate minRole="COWORK_ADMIN">
          <FeatureToggle feature="billing-management">
            <DropdownMenuItem onClick={() => router.push('/billing')}>
              <Building className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          </FeatureToggle>

          <FeatureToggle feature="integrations">
            <DropdownMenuItem onClick={() => router.push('/integrations')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Integrations</span>
            </DropdownMenuItem>
          </FeatureToggle>
        </RoleGate>

        <RoleGate requiredRole="SUPER_ADMIN">
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Super Admin</DropdownMenuLabel>

          <FeatureToggle feature="tenant-management">
            <DropdownMenuItem onClick={() => router.push('/tenants')}>
              <Crown className="mr-2 h-4 w-4" />
              <span>Manage Tenants</span>
            </DropdownMenuItem>
          </FeatureToggle>

          <FeatureToggle feature="system-settings">
            <DropdownMenuItem onClick={() => router.push('/system')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>System Settings</span>
            </DropdownMenuItem>
          </FeatureToggle>

          <FeatureToggle feature="system-logs">
            <DropdownMenuItem onClick={() => router.push('/logs')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>System Logs</span>
            </DropdownMenuItem>
          </FeatureToggle>
        </RoleGate>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified user menu for mobile or compact layouts
export function CompactUserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isCoworkAdmin) return "Cowork Admin";
    if (isClientAdmin) return "Client Admin";
    return "End User";
  };

  if (!user) {
    return null;
  }

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
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex flex-col text-right">
        <span className="text-sm font-medium">{user.email}</span>
        <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-red-600 hover:text-red-700"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Role badge component for displaying user role
export function RoleBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const { isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();

  if (!user) {
    return null;
  }

  const getRoleConfig = () => {
    if (isSuperAdmin) {
      return {
        label: "Super Admin",
        icon: Crown,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }
    if (isCoworkAdmin) {
      return {
        label: "Cowork Admin",
        icon: Shield,
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }
    if (isClientAdmin) {
      return {
        label: "Client Admin",
        icon: Building,
        className: "bg-green-100 text-green-800 border-green-200",
      };
    }
    return {
      label: "End User",
      icon: User,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  const { label, icon: Icon, className: roleClassName } = getRoleConfig();

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${roleClassName} ${className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
