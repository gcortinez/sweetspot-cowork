'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createInvitation } from '@/lib/actions/invitations'
import { Loader2, Mail, Shield, UserPlus } from 'lucide-react'
import { getAssignableRoles, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/utils/permissions'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userRole: string
  tenantId?: string
}

type ValidRole = 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'COWORK_USER'

// Remove local roleLabels - using the ones from permissions utils

export default function InviteUserModal({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  tenantId
}: InviteUserModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'COWORK_USER' as ValidRole
  })

  // Get available roles based on current user's role and cowork context
  const hasActiveCowork = !!tenantId
  const availableRoles = getAssignableRoles(userRole, hasActiveCowork)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createInvitation({
        emailAddress: formData.email,
        role: formData.role,
        tenantId: tenantId,
      })

      if (result.success) {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${formData.email}`,
        })
        onSuccess()
        handleClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar la invitación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: "Error al enviar la invitación",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      role: 'COWORK_USER'
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 text-white">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Invitar Usuario</DialogTitle>
                <DialogDescription className="text-purple-100 mt-1">
                  Añade un nuevo miembro a tu equipo de trabajo
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email Section */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center">
                <Mail className="h-3 w-3 text-blue-600" />
              </div>
              Dirección de correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo: maria@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isSubmitting}
              required
              className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-100 transition-all"
            />
            <p className="text-xs text-gray-500">
              Se enviará un email de invitación a esta dirección
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center">
                <Shield className="h-3 w-3 text-purple-600" />
              </div>
              Rol y permisos
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role" className="h-12 border-gray-200 focus:border-purple-400">
                <SelectValue placeholder="Selecciona el rol para este usuario" />
              </SelectTrigger>
              <SelectContent className="max-w-md">
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role} className="p-4 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        role === 'SUPER_ADMIN' ? 'bg-purple-500' :
                        role === 'COWORK_ADMIN' ? 'bg-blue-500' :
                        role === 'COWORK_USER' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{ROLE_LABELS[role]}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {ROLE_DESCRIPTIONS[role]}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Permission info based on current user role */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-700">ℹ</span>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Tus permisos de invitación:</p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {userRole === 'SUPER_ADMIN' && 'Como Super Administrador, puedes asignar cualquier rol.'}
                    {userRole === 'COWORK_ADMIN' && 'Como Administrador de Cowork, puedes asignar usuarios del cowork.'}
                    {userRole === 'COWORK_USER' && 'Como Usuario de Cowork, no puedes invitar otros usuarios.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-11 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.email}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando invitación...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}