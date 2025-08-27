import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { InvitationService } from '@/services/invitation.service'

/**
 * Sync Invitations API
 * Uses the centralized InvitationService for syncing invitation status
 */
export async function POST() {
  try {
    console.log('🔄 Unified Invitation Sync API called')
    
    // Check authentication and permissions
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any
    const publicMetadata = clerkUser.publicMetadata as any
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
    
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo los super administradores pueden sincronizar invitaciones' },
        { status: 403 }
      )
    }

    // Use the centralized InvitationService
    const invitationService = InvitationService.getInstance()
    const result = await invitationService.syncInvitations()

    return NextResponse.json({
      success: true,
      message: `Sincronización completada. Se sincronizaron ${result.syncedCount} invitaciones.`,
      syncedCount: result.syncedCount,
      results: result.results
    })

  } catch (error: any) {
    console.error('❌ Unified invitation sync API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al sincronizar invitaciones' },
      { status: 500 }
    )
  }
}