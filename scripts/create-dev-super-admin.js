const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔧 Creating Super Admin for development...\n');

  const email = 'gcortinez@getsweetspot.io';

  try {
    // First check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: email,
        tenantId: null
      }
    });

    if (existingUser) {
      console.log('⚠️  Super Admin already exists, updating...');
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: 'Gonzalo',
          lastName: 'Cortinez',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isActive: true,
          isOnboarded: true
        }
      });
      console.log('✅ Super Admin updated successfully!');
    } else {
      // Create new Super Admin
      const superAdmin = await prisma.user.create({
        data: {
          email: email,
          firstName: 'Gonzalo',
          lastName: 'Cortinez',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isActive: true,
          isOnboarded: true,
          tenantId: null, // Super Admin no tiene tenant
          clerkId: null // Se actualizará cuando se registre en Clerk
        }
      });
      console.log('✅ Super Admin created successfully!');
    }
    
    console.log('\n📧 Email:', email);
    console.log('🔑 Role: SUPER_ADMIN');
    console.log('🏢 Tenant: None (Super Admin has access to all tenants)');
    console.log('\n⚠️  Note: You need to register this user in Clerk to log in');
    console.log('    Use the same email (' + email + ') when registering in Clerk');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .catch(console.error)
  .finally(() => process.exit());