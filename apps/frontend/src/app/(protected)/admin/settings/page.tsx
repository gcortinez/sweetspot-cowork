"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  Settings,
  Building2,
  Clock,
  DollarSign,
  Mail,
  Bell,
  Shield,
  Database,
  Users,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Globe,
  Calendar,
  CreditCard,
  Smartphone,
  Key,
  Server,
  Lock,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { SuperAdminOnly } from "@/components/rbac/role-gate";

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  business: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    operatingHours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
  };
  booking: {
    maxAdvanceBookingDays: number;
    minBookingDuration: number;
    maxBookingDuration: number;
    cancellationPolicy: number; // hours before
    autoConfirmBookings: boolean;
    allowDoubleBooking: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    paymentReminder: boolean;
    maintenanceAlerts: boolean;
    marketingEmails: boolean;
  };
  payment: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    bankTransferEnabled: boolean;
    invoicePrefix: string;
    taxRate: number;
    lateFeePercentage: number;
    gracePeriodDays: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowGuestBookings: boolean;
    dataRetentionDays: number;
    backupFrequency: string;
    maintenanceMode: boolean;
  };
}

const SystemSettingsPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Mock settings data
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: "SweetSpot Coworking",
      siteUrl: "https://sweetspot.mx",
      adminEmail: "admin@sweetspot.mx",
      timezone: "America/Mexico_City",
      language: "es",
      currency: "MXN",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
    },
    business: {
      companyName: "SweetSpot Coworking S.A. de C.V.",
      address: "Av. Reforma 123, Col. Centro, CDMX, México",
      phone: "+52 55 1234 5678",
      email: "contacto@sweetspot.mx",
      website: "https://sweetspot.mx",
      taxId: "SSC123456789",
      operatingHours: {
        monday: { open: "08:00", close: "20:00", closed: false },
        tuesday: { open: "08:00", close: "20:00", closed: false },
        wednesday: { open: "08:00", close: "20:00", closed: false },
        thursday: { open: "08:00", close: "20:00", closed: false },
        friday: { open: "08:00", close: "20:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: true },
      },
    },
    booking: {
      maxAdvanceBookingDays: 30,
      minBookingDuration: 1,
      maxBookingDuration: 8,
      cancellationPolicy: 24,
      autoConfirmBookings: true,
      allowDoubleBooking: false,
      requireDeposit: true,
      depositPercentage: 20,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      bookingConfirmation: true,
      bookingReminder: true,
      paymentReminder: true,
      maintenanceAlerts: true,
      marketingEmails: false,
    },
    payment: {
      stripeEnabled: true,
      paypalEnabled: false,
      bankTransferEnabled: true,
      invoicePrefix: "INV",
      taxRate: 16,
      lateFeePercentage: 5,
      gracePeriodDays: 7,
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowGuestBookings: true,
      dataRetentionDays: 2555, // 7 years
      backupFrequency: "daily",
      maintenanceMode: false,
    },
  });

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "business", label: "Negocio", icon: Building2 },
    { id: "booking", label: "Reservas", icon: Calendar },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "payment", label: "Pagos", icon: CreditCard },
    { id: "security", label: "Seguridad", icon: Shield },
  ];

  const updateSetting = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        operatingHours: {
          ...prev.business.operatingHours,
          [day]: {
            ...prev.business.operatingHours[day as keyof typeof prev.business.operatingHours],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Aquí implementarías la lógica para guardar las configuraciones
      console.log("Saving system settings:", settings);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular API call
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="siteName">Nombre del Sitio</Label>
          <Input
            id="siteName"
            value={settings.general.siteName}
            onChange={(e) => updateSetting("general", "siteName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteUrl">URL del Sitio</Label>
          <Input
            id="siteUrl"
            value={settings.general.siteUrl}
            onChange={(e) => updateSetting("general", "siteUrl", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email de Administrador</Label>
          <Input
            id="adminEmail"
            type="email"
            value={settings.general.adminEmail}
            onChange={(e) => updateSetting("general", "adminEmail", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Zona Horaria</Label>
          <select
            id="timezone"
            value={settings.general.timezone}
            onChange={(e) => updateSetting("general", "timezone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/Mexico_City">México (GMT-6)</option>
            <option value="America/New_York">Nueva York (GMT-5)</option>
            <option value="Europe/Madrid">Madrid (GMT+1)</option>
            <option value="UTC">UTC (GMT+0)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <select
            id="language"
            value={settings.general.language}
            onChange={(e) => updateSetting("general", "language", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <select
            id="currency"
            value={settings.general.currency}
            onChange={(e) => updateSetting("general", "currency", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nombre de la Empresa</Label>
          <Input
            id="companyName"
            value={settings.business.companyName}
            onChange={(e) => updateSetting("business", "companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">RFC / Tax ID</Label>
          <Input
            id="taxId"
            value={settings.business.taxId}
            onChange={(e) => updateSetting("business", "taxId", e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={settings.business.address}
            onChange={(e) => updateSetting("business", "address", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={settings.business.phone}
            onChange={(e) => updateSetting("business", "phone", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email de Contacto</Label>
          <Input
            id="email"
            type="email"
            value={settings.business.email}
            onChange={(e) => updateSetting("business", "email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Horarios de Operación</h3>
        <div className="space-y-3">
          {Object.entries(settings.business.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-24">
                <span className="font-medium capitalize">{day}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => updateOperatingHours(day, "closed", !e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Abierto</span>
              </div>
              {!hours.closed && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Abre:</Label>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateOperatingHours(day, "open", e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Cierra:</Label>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateOperatingHours(day, "close", e.target.value)}
                      className="w-32"
                    />
                  </div>
                </>
              )}
              {hours.closed && (
                <Badge variant="secondary">Cerrado</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBookingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maxAdvanceBookingDays">Máximo días de anticipación</Label>
          <Input
            id="maxAdvanceBookingDays"
            type="number"
            value={settings.booking.maxAdvanceBookingDays}
            onChange={(e) => updateSetting("booking", "maxAdvanceBookingDays", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancellationPolicy">Política de cancelación (horas)</Label>
          <Input
            id="cancellationPolicy"
            type="number"
            value={settings.booking.cancellationPolicy}
            onChange={(e) => updateSetting("booking", "cancellationPolicy", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minBookingDuration">Duración mínima (horas)</Label>
          <Input
            id="minBookingDuration"
            type="number"
            value={settings.booking.minBookingDuration}
            onChange={(e) => updateSetting("booking", "minBookingDuration", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxBookingDuration">Duración máxima (horas)</Label>
          <Input
            id="maxBookingDuration"
            type="number"
            value={settings.booking.maxBookingDuration}
            onChange={(e) => updateSetting("booking", "maxBookingDuration", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depositPercentage">Porcentaje de depósito (%)</Label>
          <Input
            id="depositPercentage"
            type="number"
            value={settings.booking.depositPercentage}
            onChange={(e) => updateSetting("booking", "depositPercentage", parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Políticas de Reserva</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Confirmación automática</h4>
              <p className="text-sm text-gray-600">Las reservas se confirman automáticamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.booking.autoConfirmBookings}
                onChange={(e) => updateSetting("booking", "autoConfirmBookings", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Requerir depósito</h4>
              <p className="text-sm text-gray-600">Solicitar depósito para confirmar reservas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.booking.requireDeposit}
                onChange={(e) => updateSetting("booking", "requireDeposit", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Permitir reservas dobles</h4>
              <p className="text-sm text-gray-600">Múltiples reservas simultáneas del mismo espacio</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.booking.allowDoubleBooking}
                onChange={(e) => updateSetting("booking", "allowDoubleBooking", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Canales de Notificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Email</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.emailEnabled}
                onChange={(e) => updateSetting("notifications", "emailEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="font-medium">SMS</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.smsEnabled}
                onChange={(e) => updateSetting("notifications", "smsEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Push</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.pushEnabled}
                onChange={(e) => updateSetting("notifications", "pushEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tipos de Notificación</h3>
        <div className="space-y-3">
          {[
            { key: 'bookingConfirmation', label: 'Confirmación de reserva', desc: 'Notificar cuando se confirme una reserva' },
            { key: 'bookingReminder', label: 'Recordatorio de reserva', desc: 'Recordar reservas próximas' },
            { key: 'paymentReminder', label: 'Recordatorio de pago', desc: 'Alertas de pagos pendientes' },
            { key: 'maintenanceAlerts', label: 'Alertas de mantenimiento', desc: 'Notificar sobre mantenimiento de espacios' },
            { key: 'marketingEmails', label: 'Emails de marketing', desc: 'Promociones y ofertas especiales' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                  onChange={(e) => updateSetting("notifications", item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Métodos de Pago</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Stripe</h4>
                <p className="text-sm text-gray-600">Tarjetas de crédito y débito</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.stripeEnabled}
                onChange={(e) => updateSetting("payment", "stripeEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium">PayPal</h4>
                <p className="text-sm text-gray-600">Pagos a través de PayPal</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.paypalEnabled}
                onChange={(e) => updateSetting("payment", "paypalEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Transferencia Bancaria</h4>
                <p className="text-sm text-gray-600">Pagos directos a cuenta bancaria</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.payment.bankTransferEnabled}
                onChange={(e) => updateSetting("payment", "bankTransferEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="invoicePrefix">Prefijo de Factura</Label>
          <Input
            id="invoicePrefix"
            value={settings.payment.invoicePrefix}
            onChange={(e) => updateSetting("payment", "invoicePrefix", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={settings.payment.taxRate}
            onChange={(e) => updateSetting("payment", "taxRate", parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lateFeePercentage">Recargo por Mora (%)</Label>
          <Input
            id="lateFeePercentage"
            type="number"
            value={settings.payment.lateFeePercentage}
            onChange={(e) => updateSetting("payment", "lateFeePercentage", parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gracePeriodDays">Período de Gracia (días)</Label>
          <Input
            id="gracePeriodDays"
            type="number"
            value={settings.payment.gracePeriodDays}
            onChange={(e) => updateSetting("payment", "gracePeriodDays", parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configuración de APIs</h3>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Claves API de Stripe</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Clave Pública</Label>
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value="pk_test_***************************"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Clave Privada</Label>
                <Input
                  type={showApiKeys ? "text" : "password"}
                  value="sk_test_***************************"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxLoginAttempts">Máximo Intentos de Login</Label>
          <Input
            id="maxLoginAttempts"
            type="number"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataRetentionDays">Retención de Datos (días)</Label>
          <Input
            id="dataRetentionDays"
            type="number"
            value={settings.security.dataRetentionDays}
            onChange={(e) => updateSetting("security", "dataRetentionDays", parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Políticas de Seguridad</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Requerir Autenticación de Dos Factores</h4>
              <p className="text-sm text-gray-600">Obligatorio para todos los administradores</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.requireTwoFactor}
                onChange={(e) => updateSetting("security", "requireTwoFactor", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Permitir Reservas de Invitados</h4>
              <p className="text-sm text-gray-600">Usuarios no registrados pueden hacer reservas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.allowGuestBookings}
                onChange={(e) => updateSetting("security", "allowGuestBookings", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="font-medium text-red-900">Modo de Mantenimiento</h4>
              <p className="text-sm text-red-700">El sitio mostrará una página de mantenimiento</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.maintenanceMode}
                onChange={(e) => updateSetting("security", "maintenanceMode", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Respaldos y Mantenimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
            <select
              id="backupFrequency"
              value={settings.security.backupFrequency}
              onChange={(e) => updateSetting("security", "backupFrequency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <Server className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Último Respaldo</p>
              <p className="text-sm text-gray-600">Hace 2 horas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general": return renderGeneralSettings();
      case "business": return renderBusinessSettings();
      case "booking": return renderBookingSettings();
      case "notifications": return renderNotificationSettings();
      case "payment": return renderPaymentSettings();
      case "security": return renderSecuritySettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <SuperAdminOnly>
      <div className="h-full bg-surface-secondary">
        {/* Header */}
        <div className="bg-surface-primary border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("common.back")}
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                    Configuración del Sistema
                  </h1>
                  <p className="text-sm sm:text-body text-gray-600 mt-1">
                    Configuración global del sistema y políticas operacionales
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
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64">
              <Card className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <Card className="p-6">
                {renderTabContent()}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminOnly>
  );
};

export default SystemSettingsPage;