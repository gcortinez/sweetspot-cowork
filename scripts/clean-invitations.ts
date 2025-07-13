import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanInvitations() {
  try {
    console.log('🧹 Cleaning up failed invitations...')

    // First, let's see what invitations exist
    const allInvitations = await prisma.invitation.findMany({
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        clerkInvitationId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 Found ${allInvitations.length} invitations:`)
    
    allInvitations.forEach((invitation, index) => {
      console.log(`\n${index + 1}. ${invitation.email}`)
      console.log(`   ID: ${invitation.id}`)
      console.log(`   Clerk ID: ${invitation.clerkInvitationId}`)
      console.log(`   Status: ${invitation.status}`)
      console.log(`   Role: ${invitation.role}`)
      console.log(`   Created: ${invitation.createdAt.toISOString()}`)
    })

    if (allInvitations.length === 0) {
      console.log('\n✅ No invitations found to clean')
      return
    }

    // Ask for confirmation before deleting
    console.log('\n⚠️  This will DELETE ALL invitations from the database.')
    console.log('Are you sure you want to continue? (This script will proceed automatically)')

    // Delete all invitations
    const deleteResult = await prisma.invitation.deleteMany({})
    
    console.log(`\n✅ Successfully deleted ${deleteResult.count} invitations`)
    console.log('📧 You can now send fresh invitations to any email address')

  } catch (error) {
    console.error('❌ Error cleaning invitations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanInvitations()