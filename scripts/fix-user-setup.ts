// Script to fix user setup and clean duplicates
import { createClerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserSetup() {
  try {
    console.log('🔧 Fixing user setup...')
    
    // Create Clerk client
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    
    // Get all users from Clerk
    const response = await clerkClient.users.getUserList()
    const clerkUsers = response.data || response || []
    
    console.log('📊 Found users in Clerk:', clerkUsers.length)
    
    // Map Clerk users by email
    const clerkUserMap = new Map()
    for (const user of clerkUsers) {
      const email = user.emailAddresses[0]?.emailAddress
      if (email) {
        clerkUserMap.set(email, user)
        console.log(`- ${email} (ID: ${user.id})`)
      }
    }
    
    console.log('\n🧹 Cleaning up database...')
    
    // Step 1: Clean up duplicate users - keep the one with real Clerk ID
    const duplicateEmail = 'gcortinez@gmail.com'
    const duplicateUsers = await prisma.user.findMany({
      where: { email: duplicateEmail },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`Found ${duplicateUsers.length} users with email ${duplicateEmail}`)
    
    // Keep the user with the real Clerk ID, delete the dummy one
    const realClerkUser = clerkUserMap.get(duplicateEmail)
    if (realClerkUser && duplicateUsers.length > 1) {
      for (const user of duplicateUsers) {
        if (user.clerkId !== realClerkUser.id) {
          console.log(`Deleting duplicate user: ${user.id} (clerkId: ${user.clerkId})`)
          await prisma.user.delete({ where: { id: user.id } })
        }
      }
    }
    
    console.log('\n⚙️ Setting up correct users...')
    
    // Step 2: Set up Super Admin (gcortinez@getsweetspot.io)
    const superAdminEmail = 'gcortinez@getsweetspot.io'
    const superAdminClerkUser = clerkUserMap.get(superAdminEmail)
    
    if (superAdminClerkUser) {
      console.log(`Setting up Super Admin: ${superAdminEmail}`)
      
      // Update Clerk metadata
      await clerkClient.users.updateUserMetadata(superAdminClerkUser.id, {
        privateMetadata: {
          role: 'SUPER_ADMIN',
          tenantId: null
        },
        publicMetadata: {
          role: 'SUPER_ADMIN'
        }
      })
      
      // Update database user
      await prisma.user.updateMany({
        where: { 
          email: superAdminEmail,
          tenantId: null
        },
        data: {
          clerkId: superAdminClerkUser.id,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        }
      })
      
      console.log(`✅ Super Admin configured`)
    } else {
      console.log(`❌ Super Admin ${superAdminEmail} not found in Clerk`)
    }
    
    // Step 3: Set up Cowork Admin (gcortinez@gmail.com)
    const coworkAdminEmail = 'gcortinez@gmail.com'
    const coworkAdminClerkUser = clerkUserMap.get(coworkAdminEmail)
    
    if (coworkAdminClerkUser) {
      console.log(`Setting up Cowork Admin: ${coworkAdminEmail}`)
      
      // Use SweetSpot Central as the main tenant
      const mainTenant = await prisma.tenant.findUnique({
        where: { slug: 'sweetspot-central' }
      })
      
      if (mainTenant) {
        // Update Clerk metadata
        await clerkClient.users.updateUserMetadata(coworkAdminClerkUser.id, {
          privateMetadata: {
            role: 'COWORK_ADMIN',
            tenantId: mainTenant.id
          },
          publicMetadata: {
            role: 'COWORK_ADMIN',
            tenantId: mainTenant.id,
            tenantName: mainTenant.name
          }
        })
        
        // Update database user - find the correct one
        const existingUser = await prisma.user.findFirst({
          where: { 
            email: coworkAdminEmail,
            clerkId: coworkAdminClerkUser.id
          }
        })
        
        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              role: 'COWORK_ADMIN',
              status: 'ACTIVE',
              tenantId: mainTenant.id
            }
          })
        }
        
        console.log(`✅ Cowork Admin configured with tenant: ${mainTenant.name}`)
      }
    } else {
      console.log(`❌ Cowork Admin ${coworkAdminEmail} not found in Clerk`)
    }
    
    console.log('\n🎉 User setup completed successfully!')
    
    // Final verification
    console.log('\n📋 Final user state:')
    const finalUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        tenantId: true,
        clerkId: true,
        status: true
      },
      orderBy: { email: 'asc' }
    })
    
    for (const user of finalUsers) {
      console.log(`- ${user.email}: ${user.role} (tenant: ${user.tenantId}) [${user.clerkId}]`)
    }
    
  } catch (error) {
    console.error('❌ Error fixing user setup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserSetup()