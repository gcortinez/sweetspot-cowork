"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Save, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface UpdateCoworkForm {
  name: string;
  slug: string;
  domain: string;
  logo: string;
  description: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: {
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    language?: string;
  };
}

export default function EditCoworkPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateCoworkForm>({
    name: "",
    slug: "",
    domain: "",
    logo: "",
    description: "",
    status: 'ACTIVE',
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    settings: {
      currency: "CLP",
      timezone: "America/Santiago",
      dateFormat: "DD/MM/YYYY",
      language: "es-CL",
    },
  });

  useEffect(() => {
    if (params.id) {
      loadCoworkDetails();
    }
  }, [params.id]);

  const loadCoworkDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading cowork details for edit:', params.id);

      const response = await api.get(`/api/super-admin/coworks/${params.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar detalles del cowork');
      }

      const data = await response.json();
      console.log('Cowork details loaded for edit:', data);

      if (data.success && data.data) {
        const cowork = data.data.cowork;
        setFormData({
          name: cowork.name || "",
          slug: cowork.slug || "",
          domain: cowork.domain || "",
          logo: cowork.logo || "",
          description: cowork.description || "",
          status: cowork.status || 'ACTIVE',
          email: cowork.email || "",
          phone: cowork.phone || "",
          address: cowork.address || "",
          city: cowork.city || "",
          country: cowork.country || "",
          settings: cowork.settings || {
            currency: "CLP",
            timezone: "America/Santiago",
            dateFormat: "DD/MM/YYYY",
            language: "es-CL",
          },
        });
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error loading cowork details:', error);
      toast({
        title: "Error al cargar detalles",
        description: error instanceof Error ? error.message : "No se pudieron cargar los detalles del cowork",
        variant: "destructive",
      });
      router.push('/super-admin/coworks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.slug) {
      toast({
        title: "Datos incompletos",
        description: "El nombre y slug son obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Updating cowork:', params.id, formData);

      // Prepare update data (remove empty strings)
      const updateData: any = {
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
      };

      if (formData.domain) updateData.domain = formData.domain;
      if (formData.logo) updateData.logo = formData.logo;
      if (formData.description) updateData.description = formData.description;
      if (formData.settings) updateData.settings = formData.settings;

      const response = await api.put(`/api/super-admin/coworks/${params.id}`, updateData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar cowork');
      }

      const result = await response.json();
      console.log('Cowork updated successfully:', result);

      toast({
        title: "¡Cowork actualizado exitosamente!",
        description: `"${formData.name}" ha sido actualizado con éxito`,
      });

      // Redirect to cowork details
      router.push(`/super-admin/coworks/${params.id}`);
    } catch (error) {
      console.error('Error updating cowork:', error);
      toast({
        title: "Error al actualizar cowork",
        description: error instanceof Error ? error.message : "No se pudo actualizar el cowork",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/super-admin/coworks/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cowork</h1>
          <p className="text-gray-600 mt-1">Actualiza la información del espacio de coworking</p>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                <Label htmlFor="domain">Dominio</Label>
                <Input
                  id="domain"
                  type="url"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="https://techhub.cl"
                />
              </div>
              <div>
                <Label htmlFor="logo">URL del Logo</Label>
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
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contacto@cowork.cl"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+56912345678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Av. Providencia 1234"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Santiago"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Chile"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Regional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.settings?.currency || "CLP"}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, currency: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                    <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select
                  value={formData.settings?.timezone || "America/Santiago"}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, timezone: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Santiago">Santiago, Chile</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Buenos Aires, Argentina</SelectItem>
                    <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                    <SelectItem value="America/New_York">Nueva York, EE.UU.</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid, España</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFormat">Formato de Fecha</Label>
                <Select
                  value={formData.settings?.dateFormat || "DD/MM/YYYY"}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, dateFormat: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={formData.settings?.language || "es-CL"}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, language: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-CL">Español (Chile)</SelectItem>
                    <SelectItem value="es-ES">Español (España)</SelectItem>
                    <SelectItem value="es-MX">Español (México)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/super-admin/coworks/${params.id}`}>
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}