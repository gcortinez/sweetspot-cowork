// Script to sync Clerk users with database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncUsers() {
  try {
    console.log('🔄 Syncing users...')
    
    // Create or update Gustavo (Super Admin)
    // First check if super admin exists
    let gustavo = await prisma.user.findFirst({
      where: { 
        email: 'gcortinez@getsweetspot.io',
        tenantId: null
      }
    })
    
    if (gustavo) {
      // Update existing super admin
      gustavo = await prisma.user.update({
        where: { id: gustavo.id },
        data: {
          firstName: 'Gustavo',
          lastName: 'Cortinez',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          clerkId: 'user_gustavo_clerk_id'
        }
      })
    } else {
      // Create new super admin
      gustavo = await prisma.user.create({
        data: {
          email: 'gcortinez@getsweetspot.io',
          firstName: 'Gustavo',
          lastName: 'Cortinez',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          tenantId: null,
          clerkId: 'user_gustavo_clerk_id'
        }
      })
    }
    
    console.log('✅ Gustavo (Super Admin) created/updated:', gustavo)
    
    // Create a sample cowork/tenant first
    const cowork = await prisma.tenant.upsert({
      where: { slug: 'demo-cowork' },
      update: {
        name: 'Demo Cowork',
        slug: 'demo-cowork',
        status: 'ACTIVE'
      },
      create: {
        name: 'Demo Cowork',
        slug: 'demo-cowork',
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Demo Cowork created/updated:', cowork)
    
    // Create or update Gustavo (Cowork Admin)
    const gustavoCowork = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          tenantId: cowork.id,
          email: 'gcortinez@gmail.com'
        }
      },
      update: {
        firstName: 'Gustavo',
        lastName: 'Cortinez',
        role: 'COWORK_ADMIN',
        status: 'ACTIVE',
        clerkId: 'user_gustavo_cowork_clerk_id' // This will need to be updated with actual Clerk ID
      },
      create: {
        email: 'gcortinez@gmail.com',
        firstName: 'Gustavo',
        lastName: 'Cortinez',
        role: 'COWORK_ADMIN',
        status: 'ACTIVE',
        tenantId: cowork.id,
        clerkId: 'user_gustavo_cowork_clerk_id'
      }
    })
    
    console.log('✅ Gustavo (Cowork Admin) created/updated:', gustavoCowork)
    
    console.log('🎉 Users sync completed successfully!')
    
  } catch (error) {
    console.error('❌ Error syncing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncUsers()