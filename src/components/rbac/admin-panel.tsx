"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RoleGate,
  SuperAdminOnly,
  CoworkAdminOnly,
  ClientAdminOnly,
} from "./role-gate";
import { FeatureToggle } from "./feature-toggle";
import { useRoleAccess } from "@/contexts/auth-context";

interface AdminPanelProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

interface AdminSectionProps {
  children: ReactNode;
  title: string;
  description?: string;
  feature?: string;
  className?: string;
}

/**
 * Main admin panel wrapper that shows different content based on user role
 */
export function AdminPanel({
  children,
  title = "Admin Panel",
  description,
  className,
}: AdminPanelProps) {
  const { user, isSuperAdmin, isCoworkAdmin, isClientAdmin } = useRoleAccess();

  if (!user || (!isSuperAdmin && !isCoworkAdmin && !isClientAdmin)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access the admin panel.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Admin section for specific features or roles
 */
export function AdminSection({
  children,
  title,
  description,
  feature,
  className,
}: AdminSectionProps) {
  const content = (
    <div className={`space-y-4 ${className || ""}`}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );

  if (feature) {
    return (
      <FeatureToggle
        feature={feature}
        showFallbackMessage
        fallbackMessage={`You don't have access to ${title.toLowerCase()}`}
      >
        {content}
      </FeatureToggle>
    );
  }

  return content;
}

/**
 * Super Admin only panel
 */
export function SuperAdminPanel({
  children,
  title = "Super Admin",
  description,
  className,
}: AdminPanelProps) {
  return (
    <SuperAdminOnly
      fallback={
        <Card className={className}>
          <CardHeader>
            <CardTitle>Super Admin Access Required</CardTitle>
            <CardDescription>
              This section is only available to Super Administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <AdminPanel title={title} description={description} className={className}>
        {children}
      </AdminPanel>
    </SuperAdminOnly>
  );
}

/**
 * Cowork Admin or above panel
 */
export function CoworkAdminPanel({
  children,
  title = "Cowork Admin",
  description,
  className,
}: AdminPanelProps) {
  return (
    <RoleGate
      minRole="COWORK_ADMIN"
      fallback={
        <Card className={className}>
          <CardHeader>
            <CardTitle>Cowork Admin Access Required</CardTitle>
            <CardDescription>
              This section is only available to Cowork Administrators and above.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <AdminPanel title={title} description={description} className={className}>
        {children}
      </AdminPanel>
    </RoleGate>
  );
}

/**
 * Client Admin or above panel
 */
export function ClientAdminPanel({
  children,
  title = "Client Admin",
  description,
  className,
}: AdminPanelProps) {
  return (
    <RoleGate
      minRole="CLIENT_ADMIN"
      fallback={
        <Card className={className}>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              This section is only available to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <AdminPanel title={title} description={description} className={className}>
        {children}
      </AdminPanel>
    </RoleGate>
  );
}

/**
 * Quick access admin sections for common features
 */
export function UserManagementPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="User Management"
      description="Manage users, roles, and permissions"
      feature="user-management"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function TenantManagementPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="Tenant Management"
      description="Manage tenants and workspace configurations"
      feature="tenant-management"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function ClientManagementPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="Client Management"
      description="Manage clients and their settings"
      feature="client-management"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function SystemSettingsPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="System Settings"
      description="Configure system-wide settings and preferences"
      feature="system-settings"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function BillingManagementPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="Billing Management"
      description="Manage billing, subscriptions, and payments"
      feature="billing-management"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function ReportsPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="Reports & Analytics"
      description="View reports and analytics data"
      feature="basic-reports"
      className={className}
    >
      {children}
    </AdminSection>
  );
}

export function AdvancedReportsPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSection
      title="Advanced Reports"
      description="Access advanced reporting and data export features"
      feature="advanced-reports"
      className={className}
    >
      {children}
    </AdminSection>
  );
}
