"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/auth/auth-guard";
import { CoworkProvider } from "@/providers/cowork-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import { NavigationGuard } from "@/components/navigation/navigation-guard";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAuth
      loadingComponent={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ThemeProvider>
        <CoworkProvider>
          <NavigationGuard>
            <div className="flex h-screen bg-surface-secondary transition-theme">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }
        `}>
          <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Header */}
          <Header 
            onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobileMenuOpen={sidebarOpen}
            showMobileMenuButton={true}
          />
          
          {/* Page content */}
          <div className="flex-1 overflow-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
            </div>
          </NavigationGuard>
        </CoworkProvider>
      </ThemeProvider>
    </RequireAuth>
  );
}
