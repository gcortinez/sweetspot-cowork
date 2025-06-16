require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function debugDatabase() {
  console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DATABASE DEBUG ===');
    
    // Check all tenants
    console.log('\n--- TENANTS ---');
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      }
    });
    console.log('Tenants found:', tenants);
    
    // Check all users
    console.log('\n--- USERS ---');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        role: true,
        status: true
      }
    });
    console.log('Users found:', users);
    
    // Check all leads
    console.log('\n--- LEADS ---');
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        status: true,
        createdAt: true
      }
    });
    console.log('Leads found:', leads);
    
    // Check relation between tenants and leads
    console.log('\n--- TENANT-LEAD MAPPING ---');
    for (const tenant of tenants) {
      const tenantLeads = leads.filter(lead => lead.tenantId === tenant.id);
      console.log(`Tenant "${tenant.name}" (${tenant.id}) has ${tenantLeads.length} leads:`);
      tenantLeads.forEach(lead => {
        console.log(`  - ${lead.firstName} ${lead.lastName} (${lead.email})`);
      });
    }
    
    // Check user-tenant mapping
    console.log('\n--- USER-TENANT MAPPING ---');
    for (const tenant of tenants) {
      const tenantUsers = users.filter(user => user.tenantId === tenant.id);
      console.log(`Tenant "${tenant.name}" (${tenant.id}) has ${tenantUsers.length} users:`);
      tenantUsers.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();