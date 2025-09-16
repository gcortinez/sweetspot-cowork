import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Setting up initial data...\n');

    // 1. Verify Super Admin
    console.log('📋 Checking Super Admin user...');
    const superAdmin = await prisma.user.findFirst({
      where: {
        email: 'gcortinez@getsweetspot.io',
        role: 'SUPER_ADMIN'
      }
    });

    if (!superAdmin) {
      console.error('❌ Super Admin not found!');
      return;
    }

    console.log('✅ Super Admin found:', {
      id: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      name: `${superAdmin.firstName} ${superAdmin.lastName}`
    });

    // 2. Create a test cowork if it doesn't exist
    console.log('\n📋 Checking for test cowork...');
    let testCowork = await prisma.tenant.findFirst({
      where: {
        slug: 'test-cowork'
      }
    });

    if (!testCowork) {
      console.log('Creating test cowork...');
      testCowork = await prisma.tenant.create({
        data: {
          name: 'Test Cowork Space',
          slug: 'test-cowork',
          domain: 'test.sweetspot.io',
          description: 'Test coworking space for development',
          status: 'ACTIVE',
          settings: {
            currency: 'USD',
            timezone: 'America/Mexico_City',
            language: 'es',
            features: {
              crm: true,
              operations: true,
              financial: true,
              analytics: true
            }
          }
        }
      });
      console.log('✅ Test cowork created:', {
        id: testCowork.id,
        name: testCowork.name,
        slug: testCowork.slug
      });
    } else {
      console.log('✅ Test cowork already exists:', {
        id: testCowork.id,
        name: testCowork.name,
        slug: testCowork.slug
      });
    }

    // 3. Create a Cowork Admin user for testing
    console.log('\n📋 Checking for test Cowork Admin...');
    let coworkAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@test-cowork.com'
      }
    });

    if (!coworkAdmin) {
      console.log('Creating test Cowork Admin...');
      coworkAdmin = await prisma.user.create({
        data: {
          email: 'admin@test-cowork.com',
          firstName: 'Admin',
          lastName: 'Test',
          role: 'COWORK_ADMIN',
          status: 'ACTIVE',
          isActive: true,
          isOnboarded: true,
          tenantId: testCowork.id
        }
      });
      console.log('✅ Test Cowork Admin created:', {
        id: coworkAdmin.id,
        email: coworkAdmin.email,
        role: coworkAdmin.role,
        tenant: testCowork.name
      });
    } else {
      console.log('✅ Test Cowork Admin already exists:', {
        id: coworkAdmin.id,
        email: coworkAdmin.email,
        role: coworkAdmin.role
      });
    }

    // 4. Create some test spaces
    console.log('\n📋 Checking for test spaces...');
    const existingSpaces = await prisma.space.count({
      where: { tenantId: testCowork.id }
    });

    if (existingSpaces === 0) {
      console.log('Creating test spaces...');

      const spaces = await Promise.all([
        prisma.space.create({
          data: {
            tenantId: testCowork.id,
            name: 'Sala de Reuniones A',
            type: 'MEETING_ROOM',
            description: 'Sala para 6 personas con proyector y pizarra',
            capacity: 6,
            hourlyRate: 25.00,
            isActive: true,
            amenities: ['Proyector', 'Pizarra', 'WiFi', 'Aire acondicionado']
          }
        }),
        prisma.space.create({
          data: {
            tenantId: testCowork.id,
            name: 'Sala de Conferencias',
            type: 'CONFERENCE_ROOM',
            description: 'Sala grande para eventos y presentaciones',
            capacity: 20,
            hourlyRate: 75.00,
            isActive: true,
            amenities: ['Proyector 4K', 'Sistema de sonido', 'Streaming', 'WiFi', 'Aire acondicionado']
          }
        }),
        prisma.space.create({
          data: {
            tenantId: testCowork.id,
            name: 'Cabina Telefónica 1',
            type: 'PHONE_BOOTH',
            description: 'Espacio privado para llamadas',
            capacity: 1,
            hourlyRate: 10.00,
            isActive: true,
            amenities: ['Insonorización', 'Cargador USB', 'Ventilación']
          }
        })
      ]);

      console.log(`✅ Created ${spaces.length} test spaces`);
    } else {
      console.log(`✅ Test spaces already exist: ${existingSpaces} spaces found`);
    }

    // 5. Summary
    console.log('\n📊 Database Setup Summary:');
    console.log('========================');

    const stats = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.space.count(),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { role: 'COWORK_ADMIN' } })
    ]);

    console.log(`Total Users: ${stats[0]}`);
    console.log(`Total Coworks: ${stats[1]}`);
    console.log(`Total Spaces: ${stats[2]}`);
    console.log(`Super Admins: ${stats[3]}`);
    console.log(`Cowork Admins: ${stats[4]}`);

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('====================');
    console.log('Super Admin: gcortinez@getsweetspot.io');
    console.log('Test Cowork Admin: admin@test-cowork.com');
    console.log('\nNote: You\'ll need to set up authentication through Clerk for these users.');

  } catch (error) {
    console.error('❌ Error setting up data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());