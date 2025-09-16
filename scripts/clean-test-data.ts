import prisma from '@/lib/server/prisma'

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning test data to allow tenant deletion...\n');

    // Find the test tenant
    const testTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: 'test-cowork' },
          { name: { contains: 'Test' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!testTenant) {
      console.log('❌ No test tenant found');
      return;
    }

    console.log(`🎯 Found test tenant: ${testTenant.name} (${testTenant.slug})`);
    console.log(`📋 Tenant ID: ${testTenant.id}\n`);

    // Check current dependencies
    const tenant = await prisma.tenant.findUnique({
      where: { id: testTenant.id },
      select: {
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

    if (!tenant) {
      console.log('❌ Tenant not found');
      return;
    }

    console.log('📊 Current dependencies:');
    console.log(`   - Users: ${tenant._count.users}`);
    console.log(`   - Clients: ${tenant._count.clients}`);
    console.log(`   - Spaces: ${tenant._count.spaces}`);
    console.log(`   - Bookings: ${tenant._count.bookings}\n`);

    // Delete dependencies in correct order (reverse of foreign key dependencies)

    // 1. Delete bookings first (they depend on spaces and users)
    if (tenant._count.bookings > 0) {
      console.log('🔄 Deleting bookings...');
      const deleteBookings = await prisma.booking.deleteMany({
        where: { tenantId: testTenant.id }
      });
      console.log(`✅ Deleted ${deleteBookings.count} bookings`);
    }

    // 2. Delete space-related data (features, pricing rules, etc.)
    console.log('🔄 Deleting space-related data...');

    // Delete space features
    const spaceFeatures = await prisma.spaceFeature.deleteMany({
      where: {
        space: { tenantId: testTenant.id }
      }
    });
    console.log(`✅ Deleted ${spaceFeatures.count} space features`);

    // Delete room pricing rules
    const pricingRules = await prisma.roomPricingRule.deleteMany({
      where: { tenantId: testTenant.id }
    });
    console.log(`✅ Deleted ${pricingRules.count} pricing rules`);

    // Delete room check-ins
    const checkIns = await prisma.roomCheckIn.deleteMany({
      where: {
        space: { tenantId: testTenant.id }
      }
    });
    console.log(`✅ Deleted ${checkIns.count} check-ins`);

    // Delete room availability
    const availability = await prisma.roomAvailability.deleteMany({
      where: {
        space: { tenantId: testTenant.id }
      }
    });
    console.log(`✅ Deleted ${availability.count} availability records`);

    // Delete occupancy tracking
    const occupancy = await prisma.occupancyTracking.deleteMany({
      where: {
        space: { tenantId: testTenant.id }
      }
    });
    console.log(`✅ Deleted ${occupancy.count} occupancy records`);

    // 3. Delete spaces
    if (tenant._count.spaces > 0) {
      console.log('🔄 Deleting spaces...');
      const deleteSpaces = await prisma.space.deleteMany({
        where: { tenantId: testTenant.id }
      });
      console.log(`✅ Deleted ${deleteSpaces.count} spaces`);
    }

    // 4. Delete client-related data
    if (tenant._count.clients > 0) {
      console.log('🔄 Deleting client-related data...');

      // Delete memberships first
      const memberships = await prisma.membership.deleteMany({
        where: { client: { tenantId: testTenant.id } }
      });
      console.log(`✅ Deleted ${memberships.count} memberships`);

      // Delete service consumptions
      const consumptions = await prisma.serviceConsumption.deleteMany({
        where: { client: { tenantId: testTenant.id } }
      });
      console.log(`✅ Deleted ${consumptions.count} service consumptions`);

      // Delete invoices
      const invoices = await prisma.invoice.deleteMany({
        where: { tenantId: testTenant.id }
      });
      console.log(`✅ Deleted ${invoices.count} invoices`);

      // Delete clients
      const deleteClients = await prisma.client.deleteMany({
        where: { tenantId: testTenant.id }
      });
      console.log(`✅ Deleted ${deleteClients.count} clients`);
    }

    // 5. Delete user-related data (but keep the Super Admin user)
    console.log('🔄 Checking users...');
    const users = await prisma.user.findMany({
      where: { tenantId: testTenant.id },
      select: { id: true, email: true, role: true }
    });

    if (users.length > 0) {
      console.log(`   Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`     - ${user.email} (${user.role})`);
      });

      // Only delete non-super-admin users assigned to this tenant
      const nonSuperAdmins = users.filter(user => user.role !== 'SUPER_ADMIN');

      if (nonSuperAdmins.length > 0) {
        // Delete access logs first
        const accessLogs = await prisma.accessLog.deleteMany({
          where: { user: { tenantId: testTenant.id, role: { not: 'SUPER_ADMIN' } } }
        });
        console.log(`✅ Deleted ${accessLogs.count} access logs`);

        // Delete users (but not SUPER_ADMINs)
        const deleteUsers = await prisma.user.deleteMany({
          where: {
            tenantId: testTenant.id,
            role: { not: 'SUPER_ADMIN' }
          }
        });
        console.log(`✅ Deleted ${deleteUsers.count} non-super-admin users`);
      } else {
        console.log('ℹ️ No non-super-admin users to delete');
      }
    }

    // 6. Final dependency check
    console.log('\n🔍 Final dependency check...');
    const finalCheck = await prisma.tenant.findUnique({
      where: { id: testTenant.id },
      select: {
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

    if (finalCheck) {
      console.log('📊 Final dependencies:');
      console.log(`   - Users: ${finalCheck._count.users}`);
      console.log(`   - Clients: ${finalCheck._count.clients}`);
      console.log(`   - Spaces: ${finalCheck._count.spaces}`);
      console.log(`   - Bookings: ${finalCheck._count.bookings}`);

      const hasActiveDependencies = finalCheck._count.users > 0 ||
                                   finalCheck._count.clients > 0 ||
                                   finalCheck._count.spaces > 0 ||
                                   finalCheck._count.bookings > 0;

      console.log(`\n${hasActiveDependencies ? '❌' : '✅'} Tenant can now be deleted: ${!hasActiveDependencies ? 'YES' : 'NO'}`);
    }

    console.log('\n🎉 Test data cleanup completed!');

  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();