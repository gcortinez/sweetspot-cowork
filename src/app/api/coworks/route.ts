import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

/**
 * User Coworks API
 * Returns coworks accessible by the current user
 */

export async function GET(request: NextRequest) {
  try {
    // Try to get user from cookie first, then from Authorization header
    let user = await getCurrentUser()
    
    if (!user) {
      // Try Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const session = await import('@/lib/server/auth').then(m => m.AuthService.getSession(token))
        if (session.isValid && session.user) {
          user = session.user
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For SUPER_ADMIN with no tenantId, return empty coworks array but mark as super admin
    if (user.role === 'SUPER_ADMIN' && user.tenantId === null) {
      return NextResponse.json({
        success: true,
        data: {
          userCoworks: [],
          defaultCowork: null,
          isSuperAdmin: true
        }
      })
    }

    // For regular users, get their tenant/cowork info
    let userCoworks = []
    let defaultCowork = null
    
    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      })
      
      if (tenant && tenant.status === 'ACTIVE') {
        const cowork = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: user.role
        }
        
        userCoworks = [cowork]
        defaultCowork = cowork
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userCoworks,
        defaultCowork,
        isSuperAdmin: user.role === 'SUPER_ADMIN'
      }
    })

  } catch (error) {
    console.error('Coworks API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user coworks' },
      { status: 500 }
    )
  }
}