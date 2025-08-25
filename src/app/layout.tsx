import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/providers/query-provider";

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "SweetSpot Cowork",
  description: "Comprehensive coworking space management platform",
  keywords: "coworking, spaces, management, booking, productivity",
  authors: [{ name: "SweetSpot Team" }],
  creator: "SweetSpot",
  publisher: "SweetSpot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "SweetSpot Cowork",
    description: "Comprehensive coworking space management platform",
    siteName: "SweetSpot Cowork",
    type: "website",
  },
  robots: {
    index: false, // Private application
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" className={inter.variable}>
        <body className={`${inter.className} antialiased`}>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
