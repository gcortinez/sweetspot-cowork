import { db } from '../src/lib/db'

async function checkUserTenant() {
  try {
    console.log('🔍 Checking user tenant configuration...')

    // Check user with email gcortinez@gmail.com
    const userByEmail = await db.user.findFirst({
      where: {
        email: 'gcortinez@gmail.com'
      },
      include: {
        tenant: true
      }
    })

    console.log('📧 User by email gcortinez@gmail.com:', userByEmail)

    // Check all users with clerkId containing gcortinez or gmail
    const possibleUsers = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: 'gcortinez' } },
          { email: { contains: 'gmail' } },
          { firstName: { contains: 'Gustavo' } },
          { firstName: { contains: 'Gabriel' } }
        ]
      },
      include: {
        tenant: true
      }
    })

    console.log('👥 Possible matching users:', possibleUsers)

    // Check all tenants
    const tenants = await db.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    console.log('🏢 All tenants with users:', tenants)

    // Check if there's a super admin
    const superAdmins = await db.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      }
    })

    console.log('👑 Super admins:', superAdmins)

  } catch (error) {
    console.error('❌ Error checking user tenant:', error)
  } finally {
    await db.$disconnect()
  }
}

checkUserTenant()