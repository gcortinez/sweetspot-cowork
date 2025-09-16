import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Creating Super Admin user...');

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'gcortinez@getsweetspot.io'
      }
    });

    if (existingUser) {
      console.log('✅ User already exists:', existingUser);

      // Update to ensure it's SUPER_ADMIN
      if (existingUser.role !== 'SUPER_ADMIN') {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SUPER_ADMIN',
            tenantId: null // Super Admins don't have a tenant
          }
        });
        console.log('✅ User updated to SUPER_ADMIN:', updated);
      }

      return;
    }

    // Create new Super Admin user
    const newUser = await prisma.user.create({
      data: {
        email: 'gcortinez@getsweetspot.io',
        firstName: 'Gustavo',
        lastName: 'Cortinez',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        isOnboarded: true,
        tenantId: null, // Super Admins don't belong to a specific tenant
        // Note: clerkId will be set when the user logs in through Clerk
      }
    });

    console.log('✅ Super Admin created successfully:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: `${newUser.firstName} ${newUser.lastName}`
    });

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());