"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ArrowLeft,
  Save,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  category: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const NotificationsPage: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "booking_confirmation",
      title: "Confirmación de Reserva",
      description: "Cuando tu reserva sea confirmada",
      category: "bookings",
      email: true,
      push: true,
      sms: false,
    },
    {
      id: "booking_reminder",
      title: "Recordatorio de Reserva",
      description: "30 minutos antes de tu reserva",
      category: "bookings",
      email: true,
      push: true,
      sms: true,
    },
    {
      id: "booking_cancelled",
      title: "Reserva Cancelada",
      description: "Cuando una reserva sea cancelada",
      category: "bookings",
      email: true,
      push: true,
      sms: false,
    },
    {
      id: "payment_success",
      title: "Pago Exitoso",
      description: "Cuando un pago sea procesado exitosamente",
      category: "billing",
      email: true,
      push: false,
      sms: false,
    },
    {
      id: "payment_failed",
      title: "Pago Fallido",
      description: "Cuando un pago no pueda ser procesado",
      category: "billing",
      email: true,
      push: true,
      sms: true,
    },
    {
      id: "invoice_ready",
      title: "Factura Disponible",
      description: "Cuando una nueva factura esté lista",
      category: "billing",
      email: true,
      push: false,
      sms: false,
    },
    {
      id: "new_space",
      title: "Nuevo Espacio Disponible",
      description: "Cuando nuevos espacios estén disponibles",
      category: "spaces",
      email: false,
      push: true,
      sms: false,
    },
    {
      id: "space_maintenance",
      title: "Mantenimiento de Espacio",
      description: "Cuando un espacio esté en mantenimiento",
      category: "spaces",
      email: true,
      push: true,
      sms: false,
    },
    {
      id: "security_alert",
      title: "Alerta de Seguridad",
      description: "Actividad sospechosa en tu cuenta",
      category: "security",
      email: true,
      push: true,
      sms: true,
    },
    {
      id: "login_new_device",
      title: "Inicio de Sesión en Nuevo Dispositivo",
      description: "Cuando inicies sesión desde un dispositivo nuevo",
      category: "security",
      email: true,
      push: true,
      sms: false,
    },
  ]);

  const updateSetting = (id: string, type: 'email' | 'push' | 'sms', value: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, [type]: value } : setting
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Aquí implementarías la lógica para guardar las preferencias
      console.log("Saving notification preferences:", settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular API call
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "bookings", name: "Reservas", icon: Bell },
    { id: "billing", name: "Facturación", icon: Mail },
    { id: "spaces", name: "Instalaciones", icon: MessageSquare },
    { id: "security", name: "Seguridad", icon: CheckCircle },
  ];

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("common.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                  {t("profile.notifications")}
                </h1>
                <p className="text-sm sm:text-body text-gray-600 mt-1">
                  {t("notifications.managePreferences")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Notification Channels */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("notifications.channels")}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {t("notifications.channelsDescription")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{t("notifications.email")}</h4>
                <p className="text-sm text-gray-600">admin@sweetspot.io</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{t("notifications.push")}</h4>
                <p className="text-sm text-gray-600">{t("notifications.browserPush")}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{t("notifications.sms")}</h4>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings by Category */}
        {categories.map((category) => {
          const categorySettings = settings.filter(setting => setting.category === category.id);
          const CategoryIcon = category.icon;

          return (
            <Card key={category.id} className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <CategoryIcon className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
              </div>

              <div className="space-y-4">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200">
                  <div className="col-span-12 md:col-span-6">
                    <h4 className="text-sm font-medium text-gray-900">{t("notifications.notification")}</h4>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-center">
                    <h4 className="text-sm font-medium text-gray-900">{t("notifications.email")}</h4>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-center">
                    <h4 className="text-sm font-medium text-gray-900">{t("notifications.push")}</h4>
                  </div>
                  <div className="col-span-4 md:col-span-2 text-center">
                    <h4 className="text-sm font-medium text-gray-900">{t("notifications.sms")}</h4>
                  </div>
                </div>

                {/* Settings */}
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="grid grid-cols-12 gap-4 py-3">
                    <div className="col-span-12 md:col-span-6">
                      <h5 className="font-medium text-gray-900">{setting.title}</h5>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.email}
                          onChange={(e) => updateSetting(setting.id, 'email', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="col-span-4 md:col-span-2 flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.push}
                          onChange={(e) => updateSetting(setting.id, 'push', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="col-span-4 md:col-span-2 flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.sms}
                          onChange={(e) => updateSetting(setting.id, 'sms', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPage;