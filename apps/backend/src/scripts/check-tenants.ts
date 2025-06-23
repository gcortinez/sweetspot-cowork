#!/usr/bin/env ts-node

import { prisma } from '../lib/prisma';

async function checkTenants() {
  try {
    console.log('🔍 Checking all tenants in the database...\n');

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${tenants.length} tenant(s):\n`);

    tenants.forEach((tenant, index) => {
      console.log(`📋 Tenant ${index + 1}:`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Slug: ${tenant.slug}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Domain: ${tenant.domain || 'Not set'}`);
      console.log(`   Created: ${tenant.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Check active tenants
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
    console.log(`\n✅ Active tenants: ${activeTenants.length}`);
    console.log(`❌ Inactive/Suspended tenants: ${tenants.length - activeTenants.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTenants();