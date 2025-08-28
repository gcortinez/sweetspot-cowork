const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/nextjs/server');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding development database...\n');

  try {
    // 1. Create a development tenant
    console.log('1. Creating development tenant...');
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'dev-cowork' },
      update: {},
      create: {
        name: 'Development Cowork',
        slug: 'dev-cowork',
        description: 'Cowork de desarrollo para testing',
        status: 'ACTIVE',
        settings: {
          features: {
            bookings: true,
            invoices: true,
            visitors: true,
            services: true
          }
        }
      }
    });
    console.log('   ✅ Tenant created:', tenant.name);

    // 2. Create a Super Admin user (without tenant)
    console.log('\n2. Creating Super Admin user...');
    const superAdmin = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          tenantId: null,
          email: 'admin@localhost.dev'
        }
      },
      update: {},
      create: {
        email: 'admin@localhost.dev',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        isOnboarded: true,
        tenantId: null, // Super Admin no tiene tenant
        clerkId: null // Se actualizará cuando se registre en Clerk
      }
    });
    console.log('   ✅ Super Admin created:', superAdmin.email);

    // 3. Create a Cowork Admin user
    console.log('\n3. Creating Cowork Admin user...');
    const coworkAdmin = await prisma.user.upsert({
      where: { email: 'cowork@localhost.dev' },
      update: {},
      create: {
        email: 'cowork@localhost.dev',
        firstName: 'Cowork',
        lastName: 'Admin',
        role: 'COWORK_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        isOnboarded: true,
        tenantId: tenant.id,
        clerkId: null
      }
    });
    console.log('   ✅ Cowork Admin created:', coworkAdmin.email);

    // 4. Create a regular user
    console.log('\n4. Creating regular user...');
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@localhost.dev' },
      update: {},
      create: {
        email: 'user@localhost.dev',
        firstName: 'Test',
        lastName: 'User',
        role: 'COWORK_USER',
        status: 'ACTIVE',
        isActive: true,
        isOnboarded: true,
        tenantId: tenant.id,
        clerkId: null
      }
    });
    console.log('   ✅ Regular user created:', regularUser.email);

    // 5. Create some test clients
    console.log('\n5. Creating test clients...');
    const client1 = await prisma.client.upsert({
      where: { 
        tenantId_email: {
          tenantId: tenant.id,
          email: 'client1@example.com'
        }
      },
      update: {},
      create: {
        name: 'Empresa ABC',
        email: 'client1@example.com',
        phone: '+34 600 000 001',
        address: 'Calle Principal 123, Madrid',
        contactPerson: 'Juan Pérez',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Client 1 created:', client1.name);

    const client2 = await prisma.client.upsert({
      where: { 
        tenantId_email: {
          tenantId: tenant.id,
          email: 'client2@example.com'
        }
      },
      update: {},
      create: {
        name: 'Startup XYZ',
        email: 'client2@example.com',
        phone: '+34 600 000 002',
        contactPerson: 'María García',
        status: 'LEAD',
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Client 2 created:', client2.name);

    // 6. Create some spaces
    console.log('\n6. Creating test spaces...');
    const space1 = await prisma.space.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Sala de Reuniones A'
        }
      },
      update: {},
      create: {
        name: 'Sala de Reuniones A',
        description: 'Sala para 6 personas con proyector',
        capacity: 6,
        type: 'MEETING_ROOM',
        status: 'AVAILABLE',
        pricePerHour: 30,
        pricePerDay: 200,
        amenities: ['Proyector', 'Pizarra', 'WiFi', 'Café'],
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Space 1 created:', space1.name);

    const space2 = await prisma.space.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Oficina Privada 1'
        }
      },
      update: {},
      create: {
        name: 'Oficina Privada 1',
        description: 'Oficina privada para 4 personas',
        capacity: 4,
        type: 'PRIVATE_OFFICE',
        status: 'AVAILABLE',
        pricePerMonth: 800,
        amenities: ['Escritorios', 'Sillas ergonómicas', 'WiFi', 'Aire acondicionado'],
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Space 2 created:', space2.name);

    // 7. Create some services
    console.log('\n7. Creating test services...');
    const service1 = await prisma.service.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Impresión y Copias'
        }
      },
      update: {},
      create: {
        name: 'Impresión y Copias',
        description: 'Servicio de impresión B/N y color',
        category: 'ADMINISTRATIVE',
        price: 0.10,
        unit: 'página',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Service 1 created:', service1.name);

    const service2 = await prisma.service.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Café Premium'
        }
      },
      update: {},
      create: {
        name: 'Café Premium',
        description: 'Café de especialidad ilimitado',
        category: 'AMENITY',
        price: 50,
        unit: 'mes',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });
    console.log('   ✅ Service 2 created:', service2.name);

    console.log('\n🎉 Development database seeded successfully!');
    console.log('\n📋 Created data summary:');
    console.log('   - 1 Tenant (dev-cowork)');
    console.log('   - 3 Users (Super Admin, Cowork Admin, Regular User)');
    console.log('   - 2 Clients');
    console.log('   - 2 Spaces');
    console.log('   - 2 Services');
    console.log('\n🔑 Test users:');
    console.log('   - Super Admin: admin@localhost.dev');
    console.log('   - Cowork Admin: cowork@localhost.dev');
    console.log('   - Regular User: user@localhost.dev');
    console.log('\n⚠️  Note: Users need to be registered in Clerk to log in');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .catch(console.error)
  .finally(() => process.exit());