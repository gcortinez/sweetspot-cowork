import { prisma } from '../lib/prisma';

async function checkSuperAdmins() {
  try {
    console.log('🔍 Consultando usuarios con perfil SUPER_ADMIN...\n');

    // Query to get all SUPER_ADMIN users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (superAdmins.length === 0) {
      console.log('❌ No se encontraron usuarios con perfil SUPER_ADMIN');
      console.log('\n💡 Para crear un Super Admin, ejecuta:');
      console.log('   npm run script:create-super-admin');
    } else {
      console.log(`✅ Se encontraron ${superAdmins.length} usuario(s) con perfil SUPER_ADMIN:\n`);
      
      superAdmins.forEach((user, index) => {
        console.log(`📋 Usuario ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Estado: ${user.status}`);
        console.log(`   Tenant ID: ${user.tenantId}`);
        
        if (user.tenant) {
          console.log(`   Tenant: ${user.tenant.name} (${user.tenant.slug})`);
          console.log(`   Estado Tenant: ${user.tenant.status}`);
        } else {
          console.log(`   Tenant: No asociado`);
        }
        
        console.log(`   Creado: ${user.createdAt.toLocaleString('es-CL')}`);
        console.log(`   Actualizado: ${user.updatedAt.toLocaleString('es-CL')}`);
        console.log('');
      });
    }

    // Also check total users and their roles
    console.log('\n📊 Resumen de usuarios por rol:');
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    usersByRole.forEach(group => {
      console.log(`   ${group.role}: ${group._count.id} usuario(s)`);
    });

    // Check total users
    const totalUsers = await prisma.user.count();
    console.log(`\n👥 Total de usuarios en el sistema: ${totalUsers}`);

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSuperAdmins();