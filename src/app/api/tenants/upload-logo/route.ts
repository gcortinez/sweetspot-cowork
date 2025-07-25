import { NextRequest } from 'next/server'
import { getTenantContext } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import { convertBufferToBase64, validateImageFormat } from '@/lib/utils/image'

export async function POST(request: NextRequest) {
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
    
    // Only admins can upload logos
    const isAdmin = context.user.role === 'COWORK_ADMIN' || context.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return Response.json(
        { success: false, error: 'No tienes permisos para subir logos' },
        { status: 403 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return Response.json(
        { success: false, error: 'No se encontró el archivo' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      )
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'El archivo es muy grande. El tamaño máximo es 5MB' },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `logo-${context.tenantId}-${timestamp}.${extension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)
    
    // Generate public URL
    const logoUrl = `/uploads/logos/${filename}`
    
    // Convert to base64 for PDF generation
    const logoBase64 = convertBufferToBase64(buffer, file.type)
    
    // Update tenant with both URL and base64
    await db.tenant.update({
      where: { id: context.tenantId },
      data: {
        logo: logoUrl,
        logoBase64: logoBase64,
        updatedAt: new Date()
      }
    })
    
    return Response.json({
      success: true,
      data: {
        logoUrl,
        logoBase64: logoBase64.substring(0, 50) + '...', // Truncated for response
        filename,
        size: file.size,
        type: file.type
      },
      message: 'Logo subido exitosamente'
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return Response.json(
      { success: false, error: 'Error interno del servidor al subir el logo' },
      { status: 500 }
    )
  }
}