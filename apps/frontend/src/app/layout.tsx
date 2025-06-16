import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "SweetSpot Cowork",
  description: "Comprehensive coworking space management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
