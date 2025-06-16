import { ReactNode } from "react";
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Coffee,
  Wifi,
  Clock,
  Globe,
} from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Enhanced Branding with Visual Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-purple-900/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white min-h-screen">
          {/* Logo and Brand */}
          <a href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SweetSpot</h1>
              <p className="text-sm opacity-80">Espacios de Coworking</p>
            </div>
          </a>

          {/* Main Content */}
          <div className="space-y-8 my-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                {title || "Gestión Integral de Coworking"}
              </h2>
              <p className="text-xl opacity-90 leading-relaxed max-w-md">
                {description ||
                  "Optimiza las operaciones de tu espacio de coworking con nuestra plataforma todo-en-uno. Gestiona miembros, reservas, facturación y más."}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Users className="h-8 w-8 mb-2 text-blue-300" />
                <h3 className="font-semibold mb-1">Gestión Simple</h3>
                <p className="text-sm opacity-80">Todo en un lugar</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Calendar className="h-8 w-8 mb-2 text-green-300" />
                <h3 className="font-semibold mb-1">Reservas Fáciles</h3>
                <p className="text-sm opacity-80">Sistema intuitivo</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Shield className="h-8 w-8 mb-2 text-purple-300" />
                <h3 className="font-semibold mb-1">Seguridad</h3>
                <p className="text-sm opacity-80">Datos protegidos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <BarChart3 className="h-8 w-8 mb-2 text-yellow-300" />
                <h3 className="font-semibold mb-1">Analíticas</h3>
                <p className="text-sm opacity-80">En tiempo real</p>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-lg mb-4">
                La plataforma más completa para gestionar tu espacio de
                coworking. Automatiza tareas, mejora la experiencia de tus
                miembros y haz crecer tu negocio.
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Comienza Hoy</p>
                  <p className="text-sm opacity-80">
                    Prueba gratuita disponible
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Icons */}
          <div className="flex items-center space-x-6 text-white/60 pb-4">
            <div className="flex items-center space-x-2">
              <Coffee className="h-5 w-5" />
              <span className="text-sm">Café ilimitado</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5" />
              <span className="text-sm">WiFi rápido</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">24/7 acceso</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-4 text-center">
            <a
              href="/"
              className="flex items-center justify-center space-x-3 group"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">SweetSpot</h1>
                <p className="text-sm text-gray-600">Espacios de Coworking</p>
              </div>
            </a>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {children}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              La solución integral para espacios de coworking modernos
            </p>
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2 text-gray-400">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Seguro</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Rápido</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Globe className="h-4 w-4" />
                <span className="text-xs">Escalable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
