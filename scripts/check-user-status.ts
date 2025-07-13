import prisma from '../src/lib/server/prisma'

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status for gcortinez@gmail.com...')
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'gcortinez@gmail.com' },
          { email: 'gcortinez@getsweetspot.io' }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        clerkId: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log(`📊 Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`, {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        status: user.status,
        clerkId: user.clerkId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
    })
    
    // Also check all users to see the data structure
    console.log('\n🗃️ All users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        clerkId: true
      }
    })
    
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        email: user.email,
        status: user.status,
        clerkId: user.clerkId
      })
    })
    
  } catch (error) {
    console.error('❌ Error checking user status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserStatus()