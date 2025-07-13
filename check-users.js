const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Checking users in database...');
    
    // Get all users - using basic fields only
    const users = await prisma.user.findMany({
      select: {
        id: true,
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
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Tenant ID: ${user.tenantId || 'null'}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Count by role
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    console.log('Users by role:');
    roleStats.forEach(stat => {
      console.log(`- ${stat.role}: ${stat._count.role}`);
    });
    
    // Count by status
    const statusStats = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('\nUsers by status:');
    statusStats.forEach(stat => {
      console.log(`- ${stat.status}: ${stat._count.status}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();