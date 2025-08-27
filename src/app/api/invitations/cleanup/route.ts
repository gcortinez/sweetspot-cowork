import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { InvitationService } from '@/services/invitation.service'

/**
 * Cleanup Invitations API
 * Uses the centralized InvitationService for cleaning up duplicate/orphaned invitations
 */
export async function POST() {
  try {
    console.log('🧹 Unified Invitation Cleanup API called')
    
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
        { success: false, error: 'Solo los super administradores pueden limpiar invitaciones' },
        { status: 403 }
      )
    }

    // Use the centralized InvitationService
    const invitationService = InvitationService.getInstance()
    const result = await invitationService.cleanupInvitations()

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. Se limpiaron ${result.cleanedCount} invitaciones.`,
      cleanedCount: result.cleanedCount,
      results: result.results
    })

  } catch (error: any) {
    console.error('❌ Unified invitation cleanup API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al limpiar invitaciones' },
      { status: 500 }
    )
  }
}