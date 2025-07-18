// Script to check current database state
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...')
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        clerkId: true,
        status: true
      },
      orderBy: { email: 'asc' }
    })
    
    console.log('\n📊 Users in database:')
    for (const user of users) {
      console.log(`- ${user.email}`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Clerk ID: ${user.clerkId}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Tenant ID: ${user.tenantId}`)
      console.log(`  Status: ${user.status}`)
      console.log('')
    }
    
    // Check all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log('🏢 Tenants in database:')
    for (const tenant of tenants) {
      console.log(`- ${tenant.name} (${tenant.slug})`)
      console.log(`  ID: ${tenant.id}`)
      console.log(`  Status: ${tenant.status}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()