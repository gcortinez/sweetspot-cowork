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
  Image as ImageIcon
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
  CLIENT_ADMIN: "Administrador de Cliente", 
  END_USER: "Usuario Final",
}

const roleColors = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  COWORK_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  CLIENT_ADMIN: "bg-green-100 text-green-800 border-green-200",
  END_USER: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function CoworkSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const coworkContext = useCoworkContextOptional()
  
  // Check permissions - check both privateMetadata and publicMetadata
  const userRole = user?.privateMetadata?.role || user?.publicMetadata?.role || user?.role
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'COWORK_ADMIN'
  
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Load cowork information
  const loadCoworkInfo = async () => {
    try {
      setIsLoading(true)
      
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
      setIsLoading(false)
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
    if (user && isAdmin) {
      loadCoworkInfo()
      loadUsers()
    }
  }, [user, isAdmin])

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
    if (!coworkInfo) return
    
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

  // Check if user has access (after all hooks)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Cowork</h1>
            <p className="text-gray-600">Gestiona la información y usuarios de tu cowork</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Información del Cowork
                  </CardTitle>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label>Logo del Cowork</Label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo del cowork"
                          width={80}
                          height={80}
                          className="rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center border">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      {isEditing && (
                        <div className="absolute inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="space-y-2">
                        <Label htmlFor="logo">Subir nuevo logo</Label>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-gray-500">
                          Máximo 5MB. Formatos: JPG, PNG, GIF
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Cowork *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Nombre de tu cowork"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL del Cowork</Label>
                    <Input
                      id="slug"
                      value={coworkInfo?.slug || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      La URL no se puede cambiar
                    </p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Describe tu cowork..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Dirección completa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      placeholder="contacto@tucowork.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://tucowork.com"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={isSubmitting || !formData.name}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios del Cowork ({users.length})
                  </CardTitle>
                  <Button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invitar Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay usuarios en este cowork</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", roleColors[user.role as keyof typeof roleColors])}
                              >
                                {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                              </Badge>
                              <Badge 
                                variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {user?.role !== 'SUPER_ADMIN' && user.id !== user?.id && (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="COWORK_ADMIN">Administrador de Cowork</SelectItem>
                              <SelectItem value="CLIENT_ADMIN">Administrador de Cliente</SelectItem>
                              <SelectItem value="END_USER">Usuario Final</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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