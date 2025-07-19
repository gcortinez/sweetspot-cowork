import { NextRequest } from 'next/server'
import { getUserProfileAction } from '@/lib/actions/users'
import { getTenantContext } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext()
    
    if (!context.user) {
      return Response.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }
    
    const result = await getUserProfileAction(context.user.id)
    
    if (!result.success) {
      return Response.json(result, { status: 400 })
    }
    
    return Response.json(result)
  } catch (error) {
    console.error('Error getting user profile:', error)
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}