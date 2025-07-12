const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function showTestCredentials() {
  try {
    console.log('🔐 SweetSpot Cowork - Test Credentials\n');
    console.log('=' .repeat(60));
    
    // Get all SUPER_ADMIN users
    const superAdmins = await prisma.user.findMany({
      where: { 
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      },
      include: {
        tenant: true
      }
    });
    
    console.log('🌟 SUPER_ADMIN Users (Global Access):');
    console.log('-'.repeat(40));
    
    const globalSuperAdmins = superAdmins.filter(user => user.tenantId === null);
    
    if (globalSuperAdmins.length > 0) {
      globalSuperAdmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🏢 Access: Global (All Tenants)`);
        console.log(`   📱 Status: ${user.status}`);
        
        // Show test passwords for known accounts
        if (user.email === 'superadmin@sweetspot.com') {
          console.log(`   🔒 Password: SuperAdmin123!`);
        } else if (user.email === 'gcortinez@getsweetspot.io') {
          console.log(`   🔒 Password: [Contact system admin for password]`);
        }
        console.log('');
      });
    } else {
      console.log('   ❌ No global SUPER_ADMIN users found');
    }
    
    // Show tenant-specific super admins
    const tenantSuperAdmins = superAdmins.filter(user => user.tenantId !== null);
    
    if (tenantSuperAdmins.length > 0) {
      console.log('🏢 SUPER_ADMIN Users (Tenant-Specific):');
      console.log('-'.repeat(40));
      
      tenantSuperAdmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🏢 Tenant: ${user.tenant ? user.tenant.name + ' (' + user.tenant.slug + ')' : 'Unknown'}`);
        console.log(`   📱 Status: ${user.status}`);
        
        if (user.email === 'admin@sweetspot.io') {
          console.log(`   🔒 Password: [Contact system admin for password]`);
        }
        console.log('');
      });
    }
    
    // Get regular users for testing
    const regularUsers = await prisma.user.findMany({
      where: { 
        role: { not: 'SUPER_ADMIN' },
        status: 'ACTIVE'
      },
      include: {
        tenant: true
      },
      take: 5 // Limit to first 5 for brevity
    });
    
    if (regularUsers.length > 0) {
      console.log('👤 Regular Users (For Testing):');
      console.log('-'.repeat(40));
      
      regularUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   🏢 Tenant: ${user.tenant ? user.tenant.name + ' (' + user.tenant.slug + ')' : 'Unknown'}`);
        console.log(`   📱 Status: ${user.status}`);
        console.log('');
      });
    }
    
    // Show tenants
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' }
    });
    
    if (tenants.length > 0) {
      console.log('🏢 Available Tenants:');
      console.log('-'.repeat(40));
      
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name}`);
        console.log(`   🔗 Slug: ${tenant.slug}`);
        console.log(`   📱 Status: ${tenant.status}`);
        console.log(`   🌐 Login URL: http://localhost:3000/${tenant.slug}/login`);
        console.log('');
      });
    }
    
    console.log('=' .repeat(60));
    console.log('📝 Usage Instructions:');
    console.log('1. For GLOBAL access (all tenants): Use global SUPER_ADMIN credentials');
    console.log('2. For TENANT-SPECIFIC access: Use tenant-specific credentials');
    console.log('3. Login URL format: http://localhost:3000/[tenant-slug]/login');
    console.log('4. Global login: http://localhost:3000/login (no tenant slug)');
    console.log('');
    console.log('✅ RECOMMENDED FOR TESTING:');
    console.log('   📧 Email: superadmin@sweetspot.com');
    console.log('   🔒 Password: SuperAdmin123!');
    console.log('   🌐 URL: http://localhost:3000/login');
    console.log('   🎯 Access: Global (all tenants)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showTestCredentials();