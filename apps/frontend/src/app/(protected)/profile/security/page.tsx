"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  Shield,
  Lock,
  Smartphone,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Globe,
  Calendar,
  X,
} from "lucide-react";
import Link from "next/link";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

const SecurityPage: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [sessions] = useState<LoginSession[]>([
    {
      id: "1",
      device: "MacBook Pro (Chrome)",
      location: "Ciudad de México, México",
      ip: "192.168.1.100",
      lastActive: "Ahora",
      current: true,
    },
    {
      id: "2",
      device: "iPhone 14 (Safari)",
      location: "Ciudad de México, México",
      ip: "192.168.1.101",
      lastActive: "Hace 2 horas",
      current: false,
    },
    {
      id: "3",
      device: "Windows 11 (Edge)",
      location: "Guadalajara, México",
      ip: "192.168.2.50",
      lastActive: "Hace 1 día",
      current: false,
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      console.log("Updating password:", data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular API call
      reset();
    } catch (error) {
      console.error("Error updating password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const terminateSession = (sessionId: string) => {
    console.log("Terminating session:", sessionId);
  };

  const terminateAllSessions = () => {
    console.log("Terminating all sessions except current");
  };

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-h1 font-semibold text-gray-900">
                {t("profile.security")}
              </h1>
              <p className="text-sm sm:text-body text-gray-600 mt-1">
                {t("security.manageAccountSecurity")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("security.passwordStrength")}</h4>
                <p className="text-sm text-green-600">{t("security.strong")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                twoFactorEnabled ? "bg-green-50" : "bg-yellow-50"
              }`}>
                <Smartphone className={`h-6 w-6 ${
                  twoFactorEnabled ? "text-green-600" : "text-yellow-600"
                }`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("security.twoFactor")}</h4>
                <p className={`text-sm ${
                  twoFactorEnabled ? "text-green-600" : "text-yellow-600"
                }`}>
                  {twoFactorEnabled ? t("security.enabled") : t("security.disabled")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t("security.activeSessions")}</h4>
                <p className="text-sm text-blue-600">{sessions.length} {t("security.devices")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Change Password */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t("security.changePassword")}
          </h3>

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("security.currentPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    {...register("currentPassword")}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePassword("current")}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {t("security.newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      {...register("newPassword")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePassword("new")}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("security.confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      {...register("confirmPassword")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePassword("confirm")}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? t("common.saving") : t("security.updatePassword")}
              </Button>
            </div>
          </form>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("security.twoFactorAuth")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t("security.twoFactorDescription")}
              </p>
            </div>
            <Button
              variant={twoFactorEnabled ? "destructive" : "default"}
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            >
              {twoFactorEnabled ? t("security.disable") : t("security.enable")}
            </Button>
          </div>

          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {t("security.twoFactorEnabled")}
                  </p>
                  <p className="text-sm text-green-700">
                    {t("security.twoFactorEnabledDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Active Sessions */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("security.activeSessions")}
            </h3>
            <Button variant="destructive" size="sm" onClick={terminateAllSessions}>
              {t("security.terminateAll")}
            </Button>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{session.device}</span>
                      {session.current && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          {t("security.currentSession")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.location} • {session.ip}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {t("security.lastActive")}: {session.lastActive}
                      </span>
                    </div>
                  </div>
                </div>

                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("security.terminate")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Security Recommendations */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t("security.recommendations")}
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  {t("security.enableTwoFactor")}
                </p>
                <p className="text-sm text-yellow-700">
                  {t("security.enableTwoFactorDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {t("security.regularPasswordUpdate")}
                </p>
                <p className="text-sm text-blue-700">
                  {t("security.regularPasswordUpdateDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  {t("security.reviewSessions")}
                </p>
                <p className="text-sm text-purple-700">
                  {t("security.reviewSessionsDescription")}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPage;