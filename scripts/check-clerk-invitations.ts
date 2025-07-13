import { clerkClient } from '@clerk/nextjs/server'

async function checkClerkInvitations() {
  try {
    console.log('🔍 Checking Clerk invitations...')

    const client = await clerkClient()
    
    // Get all pending invitations from Clerk
    const invitations = await client.invitations.getInvitationList()
    
    console.log(`\n📊 Found ${invitations.totalCount} invitations in Clerk:`)
    
    invitations.data.forEach((invitation, index) => {
      console.log(`\n${index + 1}. ${invitation.emailAddress}`)
      console.log(`   ID: ${invitation.id}`)
      console.log(`   Status: ${invitation.status}`)
      console.log(`   Created: ${new Date(invitation.createdAt).toISOString()}`)
      console.log(`   Updated: ${new Date(invitation.updatedAt).toISOString()}`)
      console.log(`   Revoked: ${invitation.revokedAt ? new Date(invitation.revokedAt).toISOString() : 'No'}`)
    })

    // Check for specific email
    const targetEmail = 'gcortinez@gmail.com'
    const targetInvitation = invitations.data.find(inv => inv.emailAddress === targetEmail)
    
    if (targetInvitation) {
      console.log(`\n⚠️  Found invitation for ${targetEmail}:`)
      console.log(`   ID: ${targetInvitation.id}`)
      console.log(`   Status: ${targetInvitation.status}`)
      console.log(`   Can revoke: ${targetInvitation.status === 'pending'}`)
      
      if (targetInvitation.status === 'pending') {
        console.log('\n🔄 Attempting to revoke this invitation...')
        try {
          await client.invitations.revokeInvitation(targetInvitation.id)
          console.log('✅ Successfully revoked invitation')
        } catch (error) {
          console.error('❌ Failed to revoke invitation:', error)
        }
      }
    } else {
      console.log(`\n✅ No invitation found for ${targetEmail}`)
    }

  } catch (error) {
    console.error('❌ Error checking Clerk invitations:', error)
  }
}

checkClerkInvitations()