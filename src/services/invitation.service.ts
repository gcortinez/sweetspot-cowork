import { clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface CreateInvitationParams {
  emailAddress: string
  role: 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'COWORK_USER' | 'CLIENT_ADMIN' | 'END_USER'
  tenantId?: string
  invitedBy: string
  redirectUrl?: string
  publicMetadata?: Record<string, any>
}

export interface InvitationSyncResult {
  syncedCount: number
  results: Array<{
    email: string
    status: 'synced' | 'error' | 'no_change'
    message: string
  }>
}

export interface InvitationCleanupResult {
  cleanedCount: number
  results: Array<{
    email: string
    status: 'cleaned' | 'error'
    message: string
  }>
}

export interface UserCreationData {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  tenantId?: string
}

export class InvitationService {
  private static instance: InvitationService
  
  public static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService()
    }
    return InvitationService.instance
  }
  
  // Force cache invalidation - production deployment issue fix
  private readonly deploymentVersion = '2025-08-27-v2'

  /**
   * Create a new invitation with comprehensive validation and error handling
   */
  async createInvitation(params: CreateInvitationParams) {
    const { emailAddress, role, tenantId, invitedBy, redirectUrl, publicMetadata } = params

    logger.info('InvitationService: Creating invitation', {
      operation: 'create_invitation_start',
      email: emailAddress,
      role,
      tenantId,
      invitedBy: invitedBy.substring(0, 8) + '...',
      deploymentVersion: this.deploymentVersion,
      nodeEnv: process.env.NODE_ENV,
      environment: process.env.VERCEL_ENV || 'unknown'
    })

    try {
      // 1. Check if user already exists
      const existingUser = await this.findUserByEmail(emailAddress)
      if (existingUser) {
        throw new Error(`User with email ${emailAddress} already exists in the system`)
      }

      // 2. Handle existing invitations
      await this.handleExistingInvitations(emailAddress, tenantId)

      // 3. Get tenant information if specified
      const tenantInfo = tenantId ? await this.getTenantInfo(tenantId) : null

      // 4. Create invitation in Clerk
      const appUrl = this.getAppUrl()
      const finalRedirectUrl = redirectUrl || `${appUrl}/accept-invitation`
      
      const invitationParams = {
        emailAddress,
        redirectUrl: finalRedirectUrl,
        publicMetadata: {
          role,
          tenantId: tenantId || null,
          tenantName: tenantInfo?.name || 'SweetSpot Cowork',
          invitedBy,
          invitationDate: new Date().toISOString(),
          ...publicMetadata
        },
        notify: true,
        ignoreExisting: true
      }

      logger.debug('Creating Clerk invitation', { 
        ...invitationParams,
        invitedBy: invitedBy.substring(0, 8) + '...' // Don't log full ID for security
      })
      
      // In Next.js 15, clerkClient needs to be awaited
      const clerk = await clerkClient()
      
      // Enhanced debugging and comprehensive cleanup approach
      try {
        // 1. First get comprehensive Clerk state information
        logger.info('=== DEBUGGING CLERK STATE ===', { emailAddress })
        
        // Check for existing invitations
        const existingInvitations = await clerk.invitations.getInvitationList()
        const userInvitations = existingInvitations.data?.filter(
          inv => inv.emailAddress === emailAddress
        )
        
        logger.info('Clerk invitation state', {
          emailAddress,
          totalInvitations: existingInvitations.data?.length || 0,
          userSpecificInvitations: userInvitations?.length || 0,
          userInvitationStatuses: userInvitations?.map(inv => ({ id: inv.id, status: inv.status })) || []
        })
        
        // Check for existing users
        try {
          const users = await clerk.users.getUserList({ emailAddress: [emailAddress] })
          logger.info('Clerk user state', {
            emailAddress,
            userCount: users.data?.length || 0,
            userIds: users.data?.map(u => u.id) || []
          })
          
          if (users.data && users.data.length > 0) {
            logger.error('FOUND EXISTING USER - THIS IS THE PROBLEM', {
              emailAddress,
              users: users.data.map(u => ({ id: u.id, createdAt: u.createdAt, lastName: u.lastName }))
            })
            throw new Error(`El usuario ${emailAddress} ya existe en Clerk. Necesita ser eliminado completamente antes de crear una nueva invitación.`)
          }
        } catch (userCheckError: any) {
          if (userCheckError.message?.includes('ya existe en Clerk')) {
            throw userCheckError
          }
          logger.debug('No existing users found (expected)', { emailAddress, error: userCheckError.message })
        }
        
        // 2. Clean up any pending invitations found
        if (userInvitations && userInvitations.length > 0) {
          logger.info('Cleaning up existing invitations before creating new one', {
            emailAddress,
            invitationCount: userInvitations.length
          })
          
          for (const invitation of userInvitations) {
            if (invitation.status === 'pending') {
              try {
                await clerk.invitations.revokeInvitation(invitation.id)
                logger.info('Revoked pending invitation', { 
                  invitationId: invitation.id,
                  emailAddress,
                  originalStatus: invitation.status
                })
              } catch (revokeError: any) {
                logger.error('Could not revoke invitation', revokeError, { 
                  invitationId: invitation.id,
                  emailAddress
                })
              }
            } else {
              logger.info('Non-pending invitation found', {
                invitationId: invitation.id,
                status: invitation.status,
                emailAddress
              })
            }
          }
          
          // Extended wait for Clerk to process all changes
          logger.debug('Waiting for Clerk state synchronization...', { emailAddress })
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
        
        logger.info('=== END CLERK STATE DEBUG ===', { emailAddress })
        
      } catch (cleanupError: any) {
        if (cleanupError.message?.includes('ya existe en Clerk')) {
          throw cleanupError
        }
        logger.error('Could not complete invitation state verification', cleanupError, { emailAddress })
        // Continue with creation anyway for other errors
      }
      
      const clerkInvitation = await clerk.invitations.createInvitation(invitationParams)

      logger.debug('Clerk invitation created', { clerkInvitationId: clerkInvitation.id, emailAddress })

      // 5. Store invitation in database with error handling
      try {
        const invitation = await prisma.invitation.create({
          data: {
            id: clerkInvitation.id,
            email: emailAddress,
            role,
            tenantId,
            status: 'PENDING',
            invitedBy,
            clerkInvitationId: clerkInvitation.id
          }
        })

        logger.logInvitationCreated(emailAddress, role, tenantId, invitation.id)
        
        return {
          success: true,
          invitation: {
            id: invitation.id,
            emailAddress,
            status: 'pending' as const,
            role,
            tenantId,
            tenantName: tenantInfo?.name || 'SweetSpot Cowork',
            createdAt: invitation.createdAt.toISOString(),
            invitedBy
          }
        }

      } catch (dbError: any) {
        logger.error('Database invitation creation failed, cleaning up Clerk invitation', dbError, { emailAddress, tenantId })
        
        // Rollback: revoke Clerk invitation
        try {
          const clerk = await clerkClient()
          await clerk.invitations.revokeInvitation(clerkInvitation.id)
          logger.info('Clerk invitation revoked due to database error', { clerkInvitationId: clerkInvitation.id })
        } catch (revokeError) {
          logger.error('Failed to revoke Clerk invitation', revokeError, { clerkInvitationId: clerkInvitation.id })
        }
        
        if (dbError.code === 'P2002') {
          throw new Error('Ya existe una invitación para este email y cowork. Usa el botón "Limpiar Invitaciones" primero.')
        }
        
        throw new Error('Error creating invitation in database')
      }

    } catch (error: any) {
      logger.error('InvitationService: Create invitation failed', error, { emailAddress, role, tenantId })
      
      // Handle specific Clerk errors
      if (error.errors?.[0]?.code === 'duplicate_record') {
        throw new Error('Ya existe una invitación pendiente para este email')
      }
      
      if (error.status === 422 || error.message?.includes('Unprocessable Entity')) {
        // Log comprehensive error information
        logger.error('Clerk unprocessable entity error details', { 
          errorMessage: error.message,
          errorStatus: error.status,
          errorErrors: error.errors,
          errorCode: error.code,
          errorType: error.type,
          clerkTraceId: error.clerkTraceId,
          emailAddress,
          role,
          tenantId,
          fullErrorObject: JSON.stringify(error, null, 2)
        })
        
        // Try alternative approach: use different parameters and extended wait
        logger.info('Attempting retry with different approach', { emailAddress, errorDetails: error })
        try {
          await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
          const retryClerk = await clerkClient()
          
          // Get fresh tenant info for retry
          const retryTenantInfo = tenantId ? await this.getTenantInfo(tenantId) : null
          const retryAppUrl = this.getAppUrl()
          const retryRedirectUrl = redirectUrl || `${retryAppUrl}/accept-invitation`
          
          // Try with minimal parameters and fresh clerk client
          const retryInvitation = await retryClerk.invitations.createInvitation({
            emailAddress,
            redirectUrl: retryRedirectUrl,
            publicMetadata: {
              role,
              tenantId: tenantId || null,
              tenantName: retryTenantInfo?.name || 'SweetSpot Cowork',
              invitedBy,
              invitationDate: new Date().toISOString(),
              retryAttempt: true
            },
            notify: true,
            ignoreExisting: true
          })
          
          logger.info('Retry invitation creation succeeded', { 
            emailAddress,
            clerkInvitationId: retryInvitation.id 
          })
          
          // Store retry invitation in database
          const retryInvitationDb = await prisma.invitation.create({
            data: {
              id: retryInvitation.id,
              email: emailAddress,
              role,
              status: 'PENDING',
              clerkInvitationId: retryInvitation.id,
              tenantId,
              invitedBy
            }
          })
          
          logger.logInvitationCreated(emailAddress, role, tenantId, retryInvitationDb.id)
          
          return {
            success: true,
            invitation: {
              id: retryInvitationDb.id,
              emailAddress,
              status: 'pending' as const,
              role,
              tenantId,
              tenantName: retryTenantInfo?.name || 'SweetSpot Cowork',
              createdAt: retryInvitationDb.createdAt.toISOString(),
              invitedBy
            },
            message: 'Invitation created successfully after retry'
          }
        } catch (retryError: any) {
          logger.error('Retry also failed', retryError, { 
            emailAddress, 
            originalError: error.message,
            retryError: retryError.message
          })
        }
        
        throw new Error('Limitación temporal de Clerk: Este email fue usado recientemente y no puede ser re-invitado por unos minutos. Opciones: 1) Esperar 5-10 minutos e intentar nuevamente, 2) Usar un email alternativo, o 3) El usuario puede intentar registrarse directamente en la plataforma.')
      }
      
      if (error.errors?.[0]?.code === 'invalid_email_address') {
        throw new Error('Dirección de email inválida')
      }
      
      if (error.errors?.[0]?.code === 'invalid_url') {
        throw new Error('URL de redirección inválida')
      }
      
      throw error
    }
  }

  /**
   * Accept an invitation and create user record
   */
  async acceptInvitation(email: string, clerkUserId: string, userData?: Partial<UserCreationData>) {
    logger.info('InvitationService: Accepting invitation', { operation: 'accept_invitation_start', email, clerkUserId })

    try {
      return await prisma.$transaction(async (tx) => {
        // Find pending invitations
        const invitations = await tx.invitation.findMany({
          where: { email, status: 'PENDING' }
        })

        if (invitations.length === 0) {
          logger.warn('No pending invitations found', { email })
          return { success: true, message: 'No pending invitations to update' }
        }

        logger.info('Found pending invitations', { email, invitationCount: invitations.length })

        // Check if user already exists
        let user = await tx.user.findFirst({
          where: { clerkId: clerkUserId }
        })

        // Create user if doesn't exist
        if (!user) {
          const primaryInvitation = invitations[0]
          
          user = await tx.user.create({
            data: {
              clerkId: clerkUserId,
              email,
              firstName: userData?.firstName || '',
              lastName: userData?.lastName || '',
              role: userData?.role || primaryInvitation.role as any,
              tenantId: userData?.tenantId || primaryInvitation.tenantId,
              status: 'ACTIVE'
            }
          })
          
          logger.info('User created in database', { userId: user.id, email, clerkUserId })
        } else {
          logger.debug('User already exists', { userId: user.id, email, clerkUserId })
        }

        // Update all pending invitations
        const updated = await tx.invitation.updateMany({
          where: { email, status: 'PENDING' },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            updatedAt: new Date()
          }
        })

        logger.logInvitationAccepted(email, clerkUserId, updated.count)

        // Update Clerk user metadata to mark onboarding as complete
        try {
          const clerk = await clerkClient()
          await clerk.users.updateUserMetadata(clerkUserId, {
            publicMetadata: {
              onboardingComplete: true,
              role: user.role,
              tenantId: user.tenantId
            }
          })
          logger.info('Clerk metadata updated for completed onboarding', { clerkUserId, email })
        } catch (clerkError) {
          logger.warn('Failed to update Clerk metadata but user creation succeeded', { clerkUserId, email, error: clerkError })
          // Don't fail the entire operation if Clerk update fails
        }

        return {
          success: true,
          message: 'Invitation accepted successfully',
          updatedCount: updated.count,
          userId: user.id
        }
      })
    } catch (error) {
      logger.error('InvitationService: Accept invitation failed', error, { email, clerkUserId })
      throw new Error('Failed to accept invitation')
    }
  }

  /**
   * Sync invitations between Clerk and database
   */
  async syncInvitations(): Promise<InvitationSyncResult> {
    logger.info('InvitationService: Starting invitation sync', { operation: 'sync_invitations_start' })
    
    let syncedCount = 0
    const results: InvitationSyncResult['results'] = []

    try {
      // Get pending invitations from database
      const pendingInvitations = await prisma.invitation.findMany({
        where: { status: 'PENDING' }
      })

      logger.info('Found pending invitations in database', { count: pendingInvitations.length })

      for (const invitation of pendingInvitations) {
        try {
          const result = await this.syncSingleInvitation(invitation)
          results.push(result)
          if (result.status === 'synced') {
            syncedCount++
          }
        } catch (error) {
          logger.error('Error syncing invitation', error, { email: invitation.email })
          results.push({
            email: invitation.email,
            status: 'error',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }
      }

      console.log(`🎉 Sync complete. Synced ${syncedCount} invitations`)
      
      return { syncedCount, results }
    } catch (error) {
      console.error('❌ InvitationService: Sync failed:', error)
      throw new Error('Failed to sync invitations')
    }
  }

  /**
   * Clean up duplicate and orphaned invitations
   */
  async cleanupInvitations(): Promise<InvitationCleanupResult> {
    console.log('🧹 InvitationService: Starting invitation cleanup...')
    
    let cleanedCount = 0
    const results: InvitationCleanupResult['results'] = []

    try {
      // Get all pending invitations from Clerk
      const clerk = await clerkClient()
      const clerkInvitations = await clerk.invitations.getInvitationList()
      const pendingInvitations = clerkInvitations.data?.filter(inv => inv.status === 'pending') || []
      
      console.log(`📋 Found ${pendingInvitations.length} pending invitations in Clerk`)

      // Check each pending invitation
      for (const invitation of pendingInvitations) {
        try {
          const existingUser = await this.findUserByEmail(invitation.emailAddress)

          if (existingUser) {
            console.log(`🔄 Cleaning up duplicate for ${invitation.emailAddress}...`)
            
            // Revoke the pending invitation in Clerk
            const clerk = await clerkClient()
            await clerk.invitations.revokeInvitation(invitation.id)
            
            // Update database invitation status if exists
            await prisma.invitation.updateMany({
              where: { 
                email: invitation.emailAddress,
                status: 'PENDING' 
              },
              data: { 
                status: 'ACCEPTED',
                acceptedAt: new Date()
              }
            })

            cleanedCount++
            results.push({
              email: invitation.emailAddress,
              status: 'cleaned',
              message: 'Invitation revoked in Clerk and marked as accepted in database'
            })
            
            console.log(`✅ Cleaned up ${invitation.emailAddress}`)
          }
        } catch (error) {
          console.error(`❌ Error cleaning up ${invitation.emailAddress}:`, error)
          results.push({
            email: invitation.emailAddress,
            status: 'error',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }
      }

      // Also clean up orphaned ACCEPTED invitations
      await this.cleanupOrphanedInvitations(results, cleanedCount)

      console.log(`🎉 Cleanup complete. Cleaned ${cleanedCount} invitations`)
      
      return { cleanedCount, results }
    } catch (error) {
      console.error('❌ InvitationService: Cleanup failed:', error)
      throw new Error('Failed to cleanup invitations')
    }
  }

  // Private helper methods
  
  private async findUserByEmail(email: string) {
    return await prisma.user.findFirst({
      where: { email }
    })
  }

  private async handleExistingInvitations(email: string, tenantId?: string) {
    const existingInvitation = await prisma.invitation.findFirst({
      where: { email, tenantId }
    })

    if (existingInvitation) {
      if (existingInvitation.status === 'PENDING') {
        throw new Error('An active invitation for this email and cowork already exists')
      } else if (existingInvitation.status === 'REVOKED' || existingInvitation.status === 'ACCEPTED') {
        console.log('🗑️ Removing old invitation to allow new one:', existingInvitation.id)
        await prisma.invitation.delete({
          where: { id: existingInvitation.id }
        })
      }
    }
  }

  private async getTenantInfo(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true }
    })

    if (!tenant) {
      throw new Error('Invalid cowork selected')
    }

    return tenant
  }

  private getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  private async syncSingleInvitation(invitation: any) {
    try {
      // Check invitation status in Clerk
      let clerkInvitation = null
      
      try {
        const clerk = await clerkClient()
        // Try to find the invitation in the list
        const invitations = await clerk.invitations.getInvitationList()
        clerkInvitation = invitations.data?.find(inv => inv.id === invitation.clerkInvitationId)
      } catch (clerkError: any) {
        if (clerkError.status === 404) {
          // Invitation not found in Clerk, check if user exists
          const clerk = await clerkClient()
          const users = await clerk.users.getUserList({
            emailAddress: [invitation.email]
          })
          
          if (users && users.data.length > 0) {
            const clerkUser = users.data[0]
            
            // Create user in database and update invitation
            await this.acceptInvitation(invitation.email, clerkUser.id, {
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
              role: invitation.role,
              tenantId: invitation.tenantId
            })
            
            return {
              email: invitation.email,
              status: 'synced' as const,
              message: 'User created in database and invitation marked as accepted'
            }
          } else {
            return {
              email: invitation.email,
              status: 'no_change' as const,
              message: 'Invitation still pending - user not found in Clerk'
            }
          }
        } else {
          throw clerkError
        }
      }
      
      if (clerkInvitation && clerkInvitation.status === 'accepted') {
        const clerk2 = await clerkClient()
        const users = await clerk2.users.getUserList({
          emailAddress: [invitation.email]
        })
        
        if (users && users.data.length > 0) {
          const clerkUser = users.data[0]
          
          await this.acceptInvitation(invitation.email, clerkUser.id, {
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            role: invitation.role,
            tenantId: invitation.tenantId
          })
          
          return {
            email: invitation.email,
            status: 'synced' as const,
            message: 'User created in database and invitation marked as accepted'
          }
        }
      }
      
      return {
        email: invitation.email,
        status: 'no_change' as const,
        message: 'Invitation still pending in Clerk'
      }
    } catch (error) {
      throw error
    }
  }

  private async cleanupOrphanedInvitations(results: InvitationCleanupResult['results'], cleanedCount: number) {
    console.log(`🧹 Looking for orphaned ACCEPTED invitations...`)
    
    const acceptedInvitations = await prisma.invitation.findMany({
      where: { status: 'ACCEPTED' },
      include: { tenant: { select: { name: true } } }
    })
    
    for (const invitation of acceptedInvitations) {
      try {
        const existingUser = await this.findUserByEmail(invitation.email)

        if (!existingUser) {
          console.log(`🔄 Cleaning up orphaned ACCEPTED invitation for ${invitation.email}...`)
          
          await prisma.invitation.delete({
            where: { id: invitation.id }
          })

          cleanedCount++
          results.push({
            email: invitation.email,
            status: 'cleaned',
            message: 'Orphaned ACCEPTED invitation removed from database'
          })
          
          console.log(`✅ Cleaned up orphaned invitation for ${invitation.email}`)
        }
      } catch (error) {
        console.error(`❌ Error cleaning up orphaned invitation ${invitation.email}:`, error)
        results.push({
          email: invitation.email,
          status: 'error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
  }
}