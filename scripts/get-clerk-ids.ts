// Script to get Clerk user IDs from the Clerk API
import { createClerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getClerkIds() {
  try {
    console.log('🔍 Getting Clerk user IDs...')
    
    // Create Clerk client
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // Get all users from Clerk
    const response = await clerkClient.users.getUserList()
    const users = response.data || response || []
    
    console.log('📊 Found users in Clerk:', users.length)
    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress
      const privateMetadata = user.privateMetadata as any
      const publicMetadata = user.publicMetadata as any
      
      console.log(`- ${email} (ID: ${user.id})`)
      console.log(`  Private metadata:`, privateMetadata)
      console.log(`  Public metadata:`, publicMetadata)
      
      // Update Clerk metadata and database based on email
      if (email === 'gcortinez@getsweetspot.io') {
        // This should be the super admin
        console.log('  🔧 Setting up as SUPER_ADMIN...')
        
        // Update Clerk metadata
        await clerkClient.users.updateUserMetadata(user.id, {
          privateMetadata: {
            role: 'SUPER_ADMIN',
            tenantId: null
          },
          publicMetadata: {
            role: 'SUPER_ADMIN'
          }
        })
        
        // Update database
        const dbUser = await prisma.user.findFirst({
          where: { 
            email: email,
            tenantId: null
          }
        })
        
        if (dbUser && dbUser.clerkId !== user.id) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId: user.id }
          })
        }
        console.log(`  ✅ Updated super admin`)
      }
      
      if (email === 'gcortinez@gmail.com') {
        // This should be the cowork admin
        console.log('  🔧 Setting up as COWORK_ADMIN...')
        
        // Get the demo cowork ID
        const demoCowork = await prisma.tenant.findUnique({
          where: { slug: 'demo-cowork' }
        })
        
        if (demoCowork) {
          // Update Clerk metadata
          await clerkClient.users.updateUserMetadata(user.id, {
            privateMetadata: {
              role: 'COWORK_ADMIN',
              tenantId: demoCowork.id
            },
            publicMetadata: {
              role: 'COWORK_ADMIN'
            }
          })
          
          // Update database
          const dbUser = await prisma.user.findFirst({
            where: { 
              email: email,
              tenantId: demoCowork.id
            }
          })
          
          if (dbUser && dbUser.clerkId !== user.id) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { clerkId: user.id }
            })
          }
          console.log(`  ✅ Updated cowork admin`)
        }
      }
    }
    
    console.log('🎉 Clerk IDs updated successfully!')
    
  } catch (error) {
    console.error('❌ Error getting Clerk IDs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getClerkIds()