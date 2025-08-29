import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { esES } from '@clerk/localizations'
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/providers/query-provider";

// Optimize font loading with minimal preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "SweetSpot Cowork",
  description: "Comprehensive coworking space management platform",
  keywords: "coworking, spaces, management, booking, productivity",
  authors: [{ name: "SweetSpot Team" }],
  creator: "SweetSpot",
  publisher: "SweetSpot",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: ['/favicon.svg'],
    apple: [
      { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ]
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: (() => {
    try {
      const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return new URL('https://' + url)
      }
      return new URL(url)
    } catch {
      return new URL('http://localhost:3000')
    }
  })(),
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
  // Personalización de textos para español chileno/latinoamericano
  const spanishLocalization = {
    ...esES,
    signIn: {
      ...esES.signIn,
      start: {
        ...esES.signIn?.start,
        title: 'Inicia sesión en {{applicationName}}',
        subtitle: '¡Bienvenido de vuelta! Por favor inicia sesión para continuar',
        actionText: '¿No tienes una cuenta?'
      }
    },
    signUp: {
      ...esES.signUp,
      start: {
        ...esES.signUp?.start,
        title: 'Únete a {{applicationName}}',
        subtitle: 'Te damos la bienvenida! Por favor completa los datos para comenzar',
        actionText: '¿Ya tienes una cuenta?'
      },
      emailCode: {
        ...esES.signUp?.emailCode,
        title: 'Verifica tu correo electrónico',
        subtitle: 'Ingresa el código de verificación enviado a tu correo',
        formTitle: 'Código de verificación'
      },
      phoneCode: {
        ...esES.signUp?.phoneCode,
        title: 'Verifica tu número de teléfono',
        subtitle: 'Ingresa el código de verificación enviado a tu teléfono'
      }
    },
    userProfile: {
      ...esES.userProfile,
      navbar: {
        ...esES.userProfile?.navbar,
        title: 'Cuenta',
        description: 'Administra la información de tu cuenta',
        account: 'Perfil',
        security: 'Seguridad'
      }
    },
    organizationSwitcher: {
      ...esES.organizationSwitcher,
      action__createOrganization: 'Crear cowork',
      action__manageOrganization: 'Administrar'
    },
    formButtonPrimary: 'Continuar',
    formFieldLabel__emailAddress: 'Correo electrónico',
    formFieldLabel__password: 'Contraseña',
    formFieldLabel__firstName: 'Nombre',
    formFieldLabel__lastName: 'Apellido'
  }

  return (
    <ClerkProvider localization={spanishLocalization}>
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
