import { NextRequest } from 'next/server'
import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get tenantId from query params (for super admins)
    const { searchParams } = new URL(request.url)
    const queryTenantId = searchParams.get('tenantId')
    
    const context = await getTenantContext(queryTenantId || undefined)
    
    if (!context.user || !context.tenantId) {
      return Response.json(
        { success: false, error: 'Usuario o tenant no encontrado' },
        { status: 401 }
      )
    }
    
    // Only admins can access tenant information
    const isAdmin = context.user.role === 'COWORK_ADMIN' || context.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return Response.json(
        { success: false, error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      )
    }
    
    // For super admins, we need to get the tenant from query params or context
    const tenantId = context.effectiveTenantId || context.tenantId
    
    if (!tenantId) {
      return Response.json(
        { success: false, error: 'Tenant ID no especificado' },
        { status: 400 }
      )
    }
    
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        logoBase64: true,
        domain: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    if (!tenant) {
      return Response.json(
        { success: false, error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }
    
    return Response.json({
      success: true,
      data: tenant
    })
  } catch (error) {
    console.error('Error getting current tenant:', error)
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get tenantId from query params (for super admins)
    const { searchParams } = new URL(request.url)
    const queryTenantId = searchParams.get('tenantId')
    
    const context = await getTenantContext(queryTenantId || undefined)
    
    if (!context.user || !context.tenantId) {
      return Response.json(
        { success: false, error: 'Usuario o tenant no encontrado' },
        { status: 401 }
      )
    }
    
    // Only admins can update tenant information
    const isAdmin = context.user.role === 'COWORK_ADMIN' || context.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return Response.json(
        { success: false, error: 'No tienes permisos para actualizar esta información' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { name, description, logo, settings } = body
    
    // Validate required fields
    if (!name?.trim()) {
      return Response.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    // Get current tenant settings to merge
    const currentTenant = await db.tenant.findUnique({
      where: { id: context.tenantId },
      select: { settings: true }
    })
    
    if (!currentTenant) {
      return Response.json(
        { success: false, error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }
    
    // Merge settings
    const currentSettings = (currentTenant.settings as any) || {}
    const updatedSettings = settings ? {
      ...currentSettings,
      ...settings,
    } : currentSettings
    
    // Use effective tenant ID for updates
    const tenantId = context.effectiveTenantId || context.tenantId
    
    if (!tenantId) {
      return Response.json(
        { success: false, error: 'Tenant ID no especificado' },
        { status: 400 }
      )
    }
    
    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        logo: logo || null,
        settings: updatedSettings,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        logoBase64: true,
        domain: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    return Response.json({
      success: true,
      data: updatedTenant,
      message: 'Información del cowork actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating current tenant:', error)
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}