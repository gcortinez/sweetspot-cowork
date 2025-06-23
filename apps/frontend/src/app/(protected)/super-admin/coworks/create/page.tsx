"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Save, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface CreateCoworkForm {
  name: string;
  slug: string;
  domain: string;
  logo: string;
  description: string;
  adminUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function CreateCoworkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCoworkForm>({
    name: "",
    slug: "",
    domain: "",
    logo: "",
    description: "",
    adminUser: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.slug || !formData.adminUser.email || !formData.adminUser.password) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (formData.adminUser.password.length < 8) {
      toast({
        title: "Contraseña insegura",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Creating new cowork:', formData);

      const response = await api.post('/api/super-admin/coworks', formData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear cowork');
      }

      const result = await response.json();
      console.log('Cowork created successfully:', result);

      toast({
        title: "¡Cowork creado exitosamente!",
        description: `"${formData.name}" ha sido creado con éxito`,
      });

      // Redirect to cowork details
      router.push(`/super-admin/coworks/${result.data.cowork.id}`);
    } catch (error) {
      console.error('Error creating cowork:', error);
      toast({
        title: "Error al crear cowork",
        description: error instanceof Error ? error.message : "No se pudo crear el cowork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/coworks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Cowork</h1>
          <p className="text-gray-600 mt-1">Configura un nuevo espacio de coworking en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Cowork *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Tech Hub Santiago"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tech-hub-santiago"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="domain">Dominio (opcional)</Label>
                <Input
                  id="domain"
                  type="url"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="https://techhub.cl"
                />
              </div>
              <div>
                <Label htmlFor="logo">URL del Logo (opcional)</Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el espacio de coworking..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin User */}
        <Card>
          <CardHeader>
            <CardTitle>Usuario Administrador</CardTitle>
            <p className="text-sm text-gray-600">
              Este usuario será el administrador principal del cowork
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.adminUser.firstName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, firstName: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.adminUser.lastName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, lastName: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.adminUser.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, email: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.adminUser.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    adminUser: { ...prev.adminUser, phone: e.target.value }
                  }))}
                  placeholder="+56912345678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.adminUser.password}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  adminUser: { ...prev.adminUser, password: e.target.value }
                }))}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/super-admin/coworks">
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Cowork
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}