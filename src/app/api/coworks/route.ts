import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/server/prisma'

/**
 * User Coworks API
 * Returns coworks accessible by the current user
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user from Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    
    if (error || !supabaseUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the user record in our database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          { email: supabaseUser.email }
        ],
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
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