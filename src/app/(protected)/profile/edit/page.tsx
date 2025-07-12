"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  ArrowLeft,
  Upload,
  Globe,
  Linkedin,
  Twitter,
} from "lucide-react";
import Link from "next/link";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const EditProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "Gabriel",
      lastName: "Cortinez",
      email: user?.email || "",
      phone: "+1 (555) 123-4567",
      location: "Ciudad de México, México",
      company: "SweetSpot",
      position: "Desarrollador Full Stack",
      bio: "Desarrollador apasionado por crear soluciones innovadoras para espacios de coworking.",
      website: "",
      linkedin: "",
      twitter: "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Aquí implementarías la lógica para actualizar el perfil
      console.log("Updating profile:", data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular API call
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
                  {t("profile.editProfile")}
                </h1>
                <p className="text-sm sm:text-body text-gray-600 mt-1">
                  {t("profile.updatePersonalInfo")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                variant="secondary" 
                disabled={!isDirty || isLoading}
                className="w-full sm:w-auto"
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || isLoading}
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("profile.profilePhoto")}
            </h3>
            
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <span className="text-xl font-semibold text-white">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              
              <div>
                <Button variant="secondary" type="button">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("profile.uploadPhoto")}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  {t("profile.photoRequirements")}
                </p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t("profile.basicInfo")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="h-4 w-4 inline mr-2" />
                  {t("profile.firstName")}
                </Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  <User className="h-4 w-4 inline mr-2" />
                  {t("profile.lastName")}
                </Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  {t("profile.phone")}
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  disabled={isLoading}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  {t("profile.location")}
                </Label>
                <Input
                  id="location"
                  {...register("location")}
                  disabled={isLoading}
                  placeholder="Ciudad, País"
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Professional Information */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t("profile.professionalInfo")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  {t("profile.company")}
                </Label>
                <Input
                  id="company"
                  {...register("company")}
                  disabled={isLoading}
                  placeholder="Tu empresa"
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">
                  {t("profile.position")}
                </Label>
                <Input
                  id="position"
                  {...register("position")}
                  disabled={isLoading}
                  placeholder="Tu cargo"
                />
                {errors.position && (
                  <p className="text-sm text-destructive">{errors.position.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">
                  {t("profile.bio")}
                </Label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("profile.bioPlaceholder")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t("profile.socialLinks")}
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  {t("profile.website")}
                </Label>
                <Input
                  id="website"
                  {...register("website")}
                  disabled={isLoading}
                  placeholder="https://tuweb.com"
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">
                    <Linkedin className="h-4 w-4 inline mr-2" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    {...register("linkedin")}
                    disabled={isLoading}
                    placeholder="linkedin.com/in/tu-perfil"
                  />
                  {errors.linkedin && (
                    <p className="text-sm text-destructive">{errors.linkedin.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">
                    <Twitter className="h-4 w-4 inline mr-2" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    {...register("twitter")}
                    disabled={isLoading}
                    placeholder="@tu_usuario"
                  />
                  {errors.twitter && (
                    <p className="text-sm text-destructive">{errors.twitter.message}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;