'use client'

import React, { useState, useEffect } from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useCoworkContextOptional } from "@/providers/cowork-provider"
import { 
  Building2, 
  Settings, 
  Users, 
  Upload,
  Save,
  Edit,
  UserPlus,
  Mail,
  Shield,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  Phone,
  MapPin,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listTenantUsersAction, updateUserRoleAction } from '@/lib/actions/users'
import Image from "next/image"
import InviteUserModal from '@/components/cowork/InviteUserModal'
import { hasPermission } from '@/lib/utils/permissions'

interface CoworkInfo {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

interface TenantUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
}

const roleLabels = {
  SUPER_ADMIN: "Super Administrador",
  COWORK_ADMIN: "Administrador de Cowork",
  COWORK_USER: "Empleado de Cowork",
  CLIENT_ADMIN: "Administrador de Cliente", 
  END_USER: "Usuario Final",
}

const roleColors = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  COWORK_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  COWORK_USER: "bg-cyan-100 text-cyan-800 border-cyan-200",
  CLIENT_ADMIN: "bg-green-100 text-green-800 border-green-200",
  END_USER: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function CoworkSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const coworkContext = useCoworkContextOptional()
  
  // Check permissions - check both privateMetadata and publicMetadata
  const userRole = user?.privateMetadata?.role || user?.publicMetadata?.role || user?.role
  const hasActiveCowork = !!coworkContext?.activeCowork?.id
  
  // Check loading states more carefully
  const isUserLoading = !user
  const isCoworkLoading = coworkContext === undefined
  const isLoading = isUserLoading
  
  // Check if user can access this page (COWORK_USER and above)
  const canAccessPage = user && userRole && hasPermission(userRole, 'COWORK_USER', hasActiveCowork)
  
  // Check if user can edit cowork settings (COWORK_ADMIN and above)
  const canEditCowork = user && userRole && hasPermission(userRole, 'COWORK_ADMIN', hasActiveCowork)
  
  // Don't show permission error if still loading
  const shouldShowPermissionError = !isLoading && user && userRole && !canAccessPage
  
  const [coworkInfo, setCoworkInfo] = useState<CoworkInfo | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })
  const [users, setUsers] = useState<TenantUser[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Load cowork information
  const loadCoworkInfo = async () => {
    try {
      setIsPageLoading(true)
      
      // If super admin, we need to pass the active cowork
      const activeCoworkId = coworkContext?.activeCowork?.id
      const url = activeCoworkId && userRole === 'SUPER_ADMIN' 
        ? `/api/tenants/current?tenantId=${activeCoworkId}`
        : '/api/tenants/current'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (response.ok && result.success) {
        const cowork = result.data
        setCoworkInfo(cowork)
        setFormData({
          name: cowork.name || '',
          description: cowork.description || '',
          address: cowork.settings?.address || '',
          phone: cowork.settings?.contactInfo?.phone || '',
          email: cowork.settings?.contactInfo?.email || '',
          website: cowork.settings?.contactInfo?.website || '',
        })
        if (cowork.logo) {
          setLogoPreview(cowork.logo)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar la información del cowork",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading cowork info:', error)
      toast({
        title: "Error",
        description: "Error al cargar la información del cowork",
        variant: "destructive",
      })
    } finally {
      setIsPageLoading(false)
    }
  }

  // Load users
  const loadUsers = async () => {
    try {
      const result = await listTenantUsersAction({
        page: 1,
        limit: 50,
        tenantId: coworkContext?.activeCowork?.id, // Pass active cowork for super admins
      })
      
      if (result.success && result.data) {
        setUsers(result.data.users)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar los usuarios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Error al cargar los usuarios",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user && canAccessPage) {
      loadCoworkInfo()
      loadUsers()
    }
  }, [user, canAccessPage])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Archivo muy grande",
          description: "El logo debe ser menor a 5MB",
          variant: "destructive",
        })
        return
      }
      
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!coworkInfo || !canEditCowork) return
    
    setIsSubmitting(true)
    
    try {
      // If there's a new logo, upload it first
      let logoUrl = coworkInfo.logo
      if (logoFile) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logoFile)
        
        // If super admin, include tenant ID in the URL
        const uploadUrl = coworkContext?.activeCowork?.id && userRole === 'SUPER_ADMIN' 
          ? `/api/tenants/upload-logo?tenantId=${coworkContext.activeCowork.id}`
          : '/api/tenants/upload-logo'
          
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: logoFormData,
        })
        
        const uploadResult = await uploadResponse.json()
        if (uploadResponse.ok && uploadResult.success) {
          logoUrl = uploadResult.data.logoUrl
        } else {
          throw new Error(uploadResult.error || 'Error al subir el logo')
        }
      }
      
      // Update cowork information
      const updateData = {
        name: formData.name,
        description: formData.description,
        logo: logoUrl,
        settings: {
          address: formData.address,
          contactInfo: {
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
          }
        }
      }
      
      // If super admin, include tenant ID in the URL
      const updateUrl = coworkContext?.activeCowork?.id && userRole === 'SUPER_ADMIN' 
        ? `/api/tenants/current?tenantId=${coworkContext.activeCowork.id}`
        : '/api/tenants/current'
        
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Configuración actualizada",
          description: "La información del cowork ha sido actualizada exitosamente",
        })
        setIsEditing(false)
        await loadCoworkInfo() // Reload fresh data
        
        // Refresh cowork context if available
        if (coworkContext?.refreshContext) {
          await coworkContext.refreshContext()
        }
      } else {
        toast({
          title: "Error al actualizar",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating cowork:', error)
      toast({
        title: "Error",
        description: "Error al actualizar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (coworkInfo) {
      setFormData({
        name: coworkInfo.name || '',
        description: coworkInfo.description || '',
        address: coworkInfo.address || '',
        phone: coworkInfo.phone || '',
        email: coworkInfo.email || '',
        website: coworkInfo.website || '',
      })
      setLogoFile(null)
      setLogoPreview(coworkInfo.logo || null)
    }
    setIsEditing(false)
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const result = await updateUserRoleAction({ userId, newRole })
      
      if (result.success) {
        toast({
          title: "Rol actualizado",
          description: "El rol del usuario ha sido actualizado exitosamente",
        })
        await loadUsers() // Reload users
      } else {
        toast({
          title: "Error al actualizar rol",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el rol del usuario",
        variant: "destructive",
      })
    }
  }

  // Show loading while checking authentication and permissions
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has access (only show error when we're sure the user doesn't have permission)
  if (shouldShowPermissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700">
                    No tienes permisos para acceder a esta información
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Configuración del Cowork</h1>
                    <p className="text-blue-100 text-lg mt-1">Gestiona la información y usuarios de tu espacio de trabajo</p>
                  </div>
                </div>
                
                {coworkInfo && (
                  <div className="flex items-center gap-4 text-blue-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{coworkInfo.name}</span>
                    </div>
                    <div className="h-4 w-px bg-blue-300"></div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{users.length} usuarios activos</span>
                    </div>
                  </div>
                )}
              </div>
              
              {!canEditCowork && (
                <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-yellow-100">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Solo lectura</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm p-2">
          <Tabs defaultValue="general" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/60 p-1 rounded-xl">
              <TabsTrigger 
                value="general" 
                className="flex items-center gap-2 rounded-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
              >
                <Building2 className="h-4 w-4" />
                Información General
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 rounded-lg px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
              >
                <Users className="h-4 w-4" />
                Gestión de Usuarios
              </TabsTrigger>
            </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general" className="space-y-8 mt-8">
            <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Información del Cowork</h2>
                      <p className="text-blue-100 text-sm">Configura los datos principales de tu espacio</p>
                    </div>
                  </div>
                  {!isEditing && canEditCowork && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Información
                    </Button>
                  )}
                </div>
              </div>
              
                {/* Logo Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-6 border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Logo del Cowork</h3>
                      <p className="text-sm text-gray-600">Imagen que representa tu espacio de trabajo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-8">
                    <div className="relative group">
                      {logoPreview ? (
                        <div 
                          className="cursor-pointer transform transition-all duration-200 hover:scale-105" 
                          onClick={() => window.open(logoPreview, '_blank')}
                          title="Click para ver imagen completa"
                        >
                          <div className="relative">
                            <Image
                              src={logoPreview}
                              alt="Logo del cowork"
                              width={120}
                              height={120}
                              className="rounded-2xl object-cover border-4 border-white shadow-lg"
                              unoptimized={true}
                            />
                            <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-30 w-30 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                          <div className="text-center">
                            <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Sin logo</p>
                          </div>
                        </div>
                      )}
                      {isEditing && (
                        <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="flex-1 space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <Label htmlFor="logo" className="text-sm font-medium text-gray-700 mb-2 block">
                            Subir nuevo logo
                          </Label>
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <p>• Máximo 5MB</p>
                            <p>• Formatos: JPG, PNG, GIF, WebP</p>
                            <p>• Recomendado: 300x300px o superior</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Información Básica</h3>
                      <p className="text-sm text-gray-600">Datos principales de identificación</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Nombre del Cowork
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nombre de tu cowork"
                        className={`transition-all duration-200 ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="slug" className="text-sm font-medium text-gray-700">URL del Cowork</Label>
                      <div className="relative">
                        <Input
                          id="slug"
                          value={coworkInfo?.slug || ''}
                          disabled
                          className="bg-gray-50 text-gray-600 pr-10"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">🔒</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        La URL no se puede modificar
                      </p>
                    </div>
                    
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Describe tu espacio de trabajo, servicios y lo que lo hace especial..."
                        rows={4}
                        className={`transition-all duration-200 resize-none ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Información de Contacto</h3>
                      <p className="text-sm text-gray-600">Datos para que los clientes puedan contactarte</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Dirección
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Dirección completa del cowork"
                        className={`transition-all duration-200 ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+56 9 1234 5678"
                        className={`transition-all duration-200 ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Correo Electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        placeholder="contacto@tucowork.com"
                        className={`transition-all duration-200 ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Sitio Web
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://tucowork.com"
                        className={`transition-all duration-200 ${isEditing ? 'border-blue-200 focus:border-blue-400' : 'bg-gray-50/50'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">¿Listo para guardar los cambios?</p>
                        <p>Los cambios se aplicarán inmediatamente</p>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="px-6 py-2 hover:bg-gray-50"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSave}
                          disabled={isSubmitting || !formData.name}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200"
                        >
                          {isSubmitting ? (
                            <>
                              <Save className="h-4 w-4 mr-2 animate-spin" />
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
                    </div>
                  </div>
                )}
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-8 mt-8">
            <div className="bg-gradient-to-r from-white to-purple-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Gestión de Usuarios</h2>
                      <p className="text-purple-100 text-sm">{users.length} usuarios activos en tu cowork</p>
                    </div>
                  </div>
                  {hasPermission(userRole, 'COWORK_USER', hasActiveCowork) && (
                    <Button 
                      onClick={() => setIsInviteModalOpen(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                      variant="outline"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invitar Usuario
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                {users.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                      <Users className="h-12 w-12 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios registrados</h3>
                    <p className="text-gray-600 mb-6">Comienza invitando a tu equipo para gestionar el cowork juntos</p>
                    {hasPermission(userRole, 'COWORK_USER', hasActiveCowork) && (
                      <Button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invitar Primer Usuario
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user, index) => (
                      <div key={user.id} className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Avatar with gradient based on role */}
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg ${
                              user.role === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-purple-600 to-purple-700' :
                              user.role === 'COWORK_ADMIN' ? 'bg-gradient-to-br from-blue-600 to-blue-700' :
                              user.role === 'COWORK_USER' ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' :
                              user.role === 'CLIENT_ADMIN' ? 'bg-gradient-to-br from-green-600 to-green-700' :
                              'bg-gradient-to-br from-gray-600 to-gray-700'
                            }`}>
                              {user.firstName?.charAt(0)?.toUpperCase() || user.lastName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h4>
                                {user.role === 'SUPER_ADMIN' && (
                                  <div className="h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <span className="text-xs">👑</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs font-medium", roleColors[user.role as keyof typeof roleColors])}
                                >
                                  {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                                </Badge>
                                <Badge 
                                  variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} 
                                  className={`text-xs ${
                                    user.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  {user.status === 'ACTIVE' ? 'Activo' : user.status}
                                </Badge>
                                {user.lastLoginAt && (
                                  <span className="text-xs text-gray-500">
                                    Último acceso: {new Date(user.lastLoginAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Role selector for editable users */}
                          {user?.role !== 'SUPER_ADMIN' && user.id !== user?.id && (
                            <div className="ml-4">
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                              >
                                <SelectTrigger className="w-56 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="COWORK_ADMIN" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Administrador de Cowork
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="COWORK_USER" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                      Empleado de Cowork
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="CLIENT_ADMIN" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Administrador de Cliente
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="END_USER" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                      Usuario Final
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
    
    {/* Invite User Modal */}
    <InviteUserModal
      isOpen={isInviteModalOpen}
      onClose={() => setIsInviteModalOpen(false)}
      onSuccess={() => {
        loadUsers() // Reload users after invitation
        setIsInviteModalOpen(false)
      }}
      userRole={userRole}
      tenantId={coworkContext?.activeCowork?.id || coworkInfo?.id}
    />
    </div>
  )
}