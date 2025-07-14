"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
// Simplified without auth dependencies for now
import {
  Building2,
  Users,
  Shield,
  BarChart3,
  Calendar,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Globe,
  Smartphone,
  Play,
} from "lucide-react";

export function HomeContent() {
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('🏠 HomeContent: Rendering landing page');

    // Import debug utilities in development
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/debug-storage').then(({ debugStorage }) => {
        debugStorage();
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SweetSpot</span>
            </a>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/auth/login")}
                className="text-gray-600 hover:text-gray-900"
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span>Comenzar</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              La forma moderna de gestionar tu{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                espacio de coworking
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Optimiza las operaciones, gestiona miembros y haz crecer tu
              negocio con nuestra plataforma integral de gestión de espacios de
              coworking diseñada para el éxito de tu negocio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl"
              >
                <Zap className="h-5 w-5 mr-2" />
                <span>Prueba Gratis</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/auth/login")}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                <span>Ver Demo</span>
              </Button>
            </div>


            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                Plataforma nueva con tecnología de vanguardia
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para gestionar tu espacio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde la gestión de miembros hasta la reserva de espacios, te
              ofrecemos funciones potentes diseñadas para espacios de coworking
              modernos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-Inquilino
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Instalaciones de trabajo aisladas para diferentes organizaciones con
                completa separación de datos y seguridad.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Acceso Basado en Roles
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Permisos granulares y control de acceso para diferentes roles y
                responsabilidades de usuario.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Actualizaciones en Tiempo Real
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Notificaciones y actualizaciones en vivo mantienen a todos
                informados sobre la disponibilidad de espacios.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Análisis e Informes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Información detallada e informes para ayudarte a tomar
                decisiones basadas en datos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Simplifica las operaciones de tu coworking
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Deja de hacer malabares con múltiples herramientas y hojas de
                cálculo. SweetSpot reúne todo en una plataforma potente e
                intuitiva.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Reservas y programación automatizadas",
                  "Gestión de miembros y facturación",
                  "Seguimiento de utilización de espacios",
                  "Interfaz adaptada a móviles",
                  "Soporte al cliente 24/7",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl"
              >
                <span>Comienza tu Prueba Gratis</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Reservas de Hoy
                      </h4>
                      <p className="text-gray-600">12 reservas activas</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        name: "Sala de Reuniones A",
                        time: "9:00 AM - 11:00 AM",
                        status: "ocupada",
                        color: "green",
                      },
                      {
                        name: "Escritorio Flexible #5",
                        time: "10:00 AM - 6:00 PM",
                        status: "ocupado",
                        color: "green",
                      },
                      {
                        name: "Cabina Telefónica 2",
                        time: "2:00 PM - 3:00 PM",
                        status: "disponible",
                        color: "blue",
                      },
                    ].map((booking, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.time}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.color === "green"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {booking.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-600 text-white p-3 rounded-xl shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                100%
              </div>
              <div className="text-blue-100 text-lg">En la Nube</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                24/7
              </div>
              <div className="text-blue-100 text-lg">Soporte Disponible</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                0€
              </div>
              <div className="text-blue-100 text-lg">Para Empezar</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu espacio de coworking?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Sé de los primeros en usar SweetSpot para optimizar las operaciones
            de tu espacio de coworking y hacer crecer tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/auth/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl"
            >
              <Zap className="h-5 w-5 mr-2" />
              <span>Prueba Gratis</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <a
              href="/"
              className="flex items-center space-x-3 mb-4 md:mb-0 group"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">SweetSpot</span>
            </a>
            <div className="flex items-center space-x-6 text-gray-600">
              <Globe className="h-5 w-5" />
              <Smartphone className="h-5 w-5" />
              <Shield className="h-5 w-5" />
            </div>
            <p className="text-gray-600 mt-4 md:mt-0">
              © 2024 SweetSpot. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}