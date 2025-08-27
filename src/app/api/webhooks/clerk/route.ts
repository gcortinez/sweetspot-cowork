import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { InvitationService } from '@/services/invitation.service'
import { logger } from '@/lib/logger'

// Clerk webhook secret - you need to add this to your environment variables
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  logger.info('Clerk webhook received', { operation: 'webhook_start' })
  
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.error('Missing svix headers', undefined, { operation: 'webhook_validation' })
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    logger.debug('Verifying webhook signature')
    
    try {
      const wh = new Webhook(webhookSecret)
      const evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any
      
      logger.debug('Webhook signature verified successfully')
      Object.assign(payload, evt)
    } catch (err) {
      logger.error('Error verifying webhook signature', err)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }
  } else {
    logger.warn('CLERK_WEBHOOK_SECRET not configured - skipping verification (development only)')
  }

  // Handle the webhook events
  const { type, data } = payload
  const invitationService = InvitationService.getInstance()

  logger.logWebhookReceived(type, data.id || data.user_id, data.email_addresses?.[0]?.email_address)

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data, invitationService)
        break

      case 'session.created':
        await handleSessionCreated(data, invitationService)
        break

      case 'user.updated':
        logger.info('User updated webhook - no action needed', { webhookType: type })
        break

      case 'user.deleted':
        logger.info('User deleted webhook - cleaning up database', { webhookType: type })
        // TODO: Implement user cleanup if needed
        break

      default:
        logger.warn('Unhandled webhook event', { webhookType: type })
    }

    logger.logWebhookProcessed(type, true, data.id || data.user_id)
    return NextResponse.json({ received: true, processed: true })
    
  } catch (error) {
    logger.logWebhookProcessed(type, false, data.id || data.user_id)
    logger.error('Webhook processing failed', error, { webhookType: type, eventData: JSON.stringify(data, null, 2) })
    
    // Return 200 to avoid retries for unrecoverable errors
    // Clerk will retry 500 errors but not 200s
    return NextResponse.json({ 
      received: true, 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 200 })
  }
}

/**
 * Handle user.created webhook event
 */
async function handleUserCreated(data: any, invitationService: InvitationService) {
  const email = data.email_addresses?.[0]?.email_address
  const clerkUserId = data.id
  
  if (!email || !clerkUserId) {
    logger.warn('Missing email or user ID in user.created webhook', { clerkUserId, email })
    return
  }

  logger.info('Processing user.created webhook', { email, clerkUserId })
  
  try {
    // Use the centralized service to accept the invitation
    const result = await invitationService.acceptInvitation(email, clerkUserId, {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: email,
      clerkId: clerkUserId
    })
    
    if (result.success) {
      logger.info('Invitation processed via webhook', { email, message: result.message })
    } else {
      logger.warn('Invitation processing returned non-success', { email, result })
    }
  } catch (error) {
    logger.error('Failed to process user.created webhook', error, { email, clerkUserId })
    throw error
  }
}

/**
 * Handle session.created webhook event
 */
async function handleSessionCreated(data: any, invitationService: InvitationService) {
  const clerkUserId = data.user_id
  
  if (!clerkUserId) {
    logger.warn('Missing user ID in session.created webhook', { clerkUserId })
    return
  }

  logger.info('Processing session.created webhook', { clerkUserId })
  
  // This is a fallback for cases where user.created webhook might have failed
  // We'll check if there are any pending invitations that need processing
  try {
    // Get user info from Clerk to find their email
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkUserId)
    const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    
    if (email) {
      const result = await invitationService.acceptInvitation(email, clerkUserId, {
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        email: email,
        clerkId: clerkUserId
      })
      
      if (result.success && result.updatedCount > 0) {
        logger.info('Processed pending invitations via session webhook', { email, message: result.message })
      } else {
        logger.info('No pending invitations found for session webhook', { email })
      }
    }
  } catch (error) {
    logger.error('Failed to process session.created webhook', error, { clerkUserId })
    // Don't throw here as session creation is not critical for invitation flow
  }
}