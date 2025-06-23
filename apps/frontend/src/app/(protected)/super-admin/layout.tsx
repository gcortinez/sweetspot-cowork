"use client";

import { SuperAdminGuard } from "@/components/auth/super-admin-guard";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Super Admin Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-800 flex items-center justify-center">
              <span className="text-sm font-bold">SA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Administración del Sistema</h1>
              <p className="text-red-100 text-sm">Panel de control Super Admin</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </SuperAdminGuard>
  );
}