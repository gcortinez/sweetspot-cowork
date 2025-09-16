import prisma from '@/lib/server/prisma'

async function checkTenantDependencies() {
  try {
    console.log('🔍 Checking all tenants and their dependencies...\n');

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: {
            users: true,
            clients: true,
            spaces: true,
            bookings: true,
          }
        }
      }
    });

    if (tenants.length === 0) {
      console.log('❌ No tenants found in database');
      return;
    }

    for (const tenant of tenants) {
      console.log(`📊 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Dependencies:`);
      console.log(`     - Users: ${tenant._count.users}`);
      console.log(`     - Clients: ${tenant._count.clients}`);
      console.log(`     - Spaces: ${tenant._count.spaces}`);
      console.log(`     - Bookings: ${tenant._count.bookings}`);

      const hasActiveDependencies = tenant._count.users > 0 ||
                                   tenant._count.clients > 0 ||
                                   tenant._count.spaces > 0 ||
                                   tenant._count.bookings > 0;

      console.log(`   Can Delete: ${hasActiveDependencies ? '❌ NO' : '✅ YES'}\n`);

      // If there are dependencies, show details
      if (hasActiveDependencies) {
        console.log(`   🔍 Detailed breakdown for ${tenant.name}:`);

        if (tenant._count.users > 0) {
          const users = await prisma.user.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, email: true, firstName: true, lastName: true, role: true }
          });
          console.log(`     Users (${users.length}):`);
          users.forEach(user => {
            console.log(`       - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
          });
        }

        if (tenant._count.clients > 0) {
          const clients = await prisma.client.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, name: true, email: true, status: true }
          });
          console.log(`     Clients (${clients.length}):`);
          clients.forEach(client => {
            console.log(`       - ${client.name} (${client.email}) - ${client.status}`);
          });
        }

        if (tenant._count.spaces > 0) {
          const spaces = await prisma.space.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, name: true, type: true, isActive: true }
          });
          console.log(`     Spaces (${spaces.length}):`);
          spaces.forEach(space => {
            console.log(`       - ${space.name} (${space.type}) - ${space.isActive ? 'Active' : 'Inactive'}`);
          });
        }

        if (tenant._count.bookings > 0) {
          const bookings = await prisma.booking.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, status: true, startTime: true, endTime: true }
          });
          console.log(`     Bookings (${bookings.length}):`);
          bookings.forEach(booking => {
            console.log(`       - ${booking.id} (${booking.status}) - ${booking.startTime} to ${booking.endTime}`);
          });
        }

        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error checking tenant dependencies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantDependencies();