import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import prisma from '@/lib/server/prisma'

// Clerk webhook secret - you need to add this to your environment variables
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Error occurred -- no svix headers' }, { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // If webhook secret is not configured, log warning and process anyway (for development)
  if (!webhookSecret) {
    console.warn('⚠️ CLERK_WEBHOOK_SECRET not configured - skipping verification')
  } else {
    // Create a new Svix instance with your secret.
    const wh = new Webhook(webhookSecret)

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json({ error: 'Error occurred' }, { status: 400 })
    }

    // Use verified event
    Object.assign(payload, evt)
  }

  // Handle the webhook events
  const { type, data } = payload

  console.log('🔔 Clerk webhook received:', type)

  switch (type) {
    case 'user.created':
      // When a user is created, check if it's from an invitation
      console.log('👤 User created webhook received for:', data.email_addresses[0]?.email_address)
      
      try {
        const email = data.email_addresses[0]?.email_address
        
        if (email) {
          // Check if user already exists in our database
          const existingUser = await prisma.user.findFirst({
            where: { clerkId: data.id }
          })
          
          if (existingUser) {
            console.log('👤 User already exists in database:', existingUser.id)
            return NextResponse.json({ received: true })
          }
          
          // Find the invitation
          const invitation = await prisma.invitation.findFirst({
            where: {
              email,
              status: 'PENDING'
            }
          })
          
          if (invitation) {
            console.log('📧 Found pending invitation, creating user')
            
            // Create the user
            const user = await prisma.user.create({
              data: {
                clerkId: data.id,
                email,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                role: invitation.role as any,
                tenantId: invitation.tenantId,
                status: 'ACTIVE'
              }
            })
            
            // Update invitation status
            await prisma.invitation.update({
              where: { id: invitation.id },
              data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
              }
            })
            
            console.log('✅ User created and invitation accepted:', email, 'User ID:', user.id)
          } else {
            console.log('⚠️ No pending invitation found for email:', email)
          }
        }
      } catch (error) {
        console.error('❌ Error processing user.created webhook:', error)
      }
      break

    case 'session.created':
      // When a session is created, check if there are pending invitations to accept
      if (data.user_id) {
        try {
          const user = await prisma.user.findUnique({
            where: { clerkId: data.user_id }
          })
          
          if (user) {
            // Update any pending invitations for this user
            await prisma.invitation.updateMany({
              where: {
                email: user.email,
                status: 'PENDING'
              },
              data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
              }
            })
          }
        } catch (error) {
          console.error('❌ Error processing session.created webhook:', error)
        }
      }
      break

    default:
      console.log(`🔔 Unhandled webhook type: ${type}`)
  }

  return NextResponse.json({ received: true })
}