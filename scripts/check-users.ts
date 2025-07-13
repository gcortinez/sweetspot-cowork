import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('👥 Checking all users in database...')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 Found ${users.length} users:`)
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Clerk ID: ${user.clerkId || 'NULL'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Tenant ID: ${user.tenantId || 'NULL'}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
    })

    // Check for duplicate emails
    const emailCounts = users.reduce((acc, user) => {
      acc[user.email] = (acc[user.email] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1)
    
    if (duplicateEmails.length > 0) {
      console.log('\n⚠️  Duplicate emails found:')
      duplicateEmails.forEach(([email, count]) => {
        console.log(`   ${email}: ${count} occurrences`)
      })
    } else {
      console.log('\n✅ No duplicate emails found')
    }

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()