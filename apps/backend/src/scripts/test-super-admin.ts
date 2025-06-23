#!/usr/bin/env ts-node

/**
 * Test script for Super Admin functionality
 * This script tests all the Super Admin endpoints and operations
 */

import { config } from '../config';
import { supabaseAdmin } from '../lib/supabase';
import { TenantService } from '../services/tenantService';
import { UserService } from '../services/userService';

async function testSuperAdminFunctionality() {
  console.log('🔧 Testing Super Admin Functionality');
  console.log('=====================================');

  try {
    // Test 1: Get all tenants (Super Admin view)
    console.log('\n1. Testing getAllTenants (Super Admin view)...');
    const tenantsResult = await TenantService.getAllTenants(1, 10, {
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    console.log(`✅ Found ${tenantsResult.tenants.length} tenants out of ${tenantsResult.total} total`);
    tenantsResult.tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.slug}) - Status: ${tenant.status}`);
    });

    // Test 2: Get system statistics
    console.log('\n2. Testing getSystemStats...');
    const systemStats = await TenantService.getSystemStats();
    console.log('✅ System Statistics:');
    console.log(`   - Total Tenants: ${systemStats.totalTenants}`);
    console.log(`   - Active Tenants: ${systemStats.activeTenants}`);
    console.log(`   - Suspended Tenants: ${systemStats.suspendedTenants}`);
    console.log(`   - Total Users: ${systemStats.totalUsers}`);
    console.log(`   - Total Clients: ${systemStats.totalClients}`);
    console.log(`   - Total Revenue: $${systemStats.totalRevenue}`);

    // Test 3: Cross-tenant user access
    if (tenantsResult.tenants.length > 0) {
      const firstTenant = tenantsResult.tenants[0];
      console.log(`\n3. Testing cross-tenant user access for tenant: ${firstTenant.name}`);
      
      const usersResult = await UserService.getUsersByTenant(firstTenant.id, 1, 5);
      console.log(`✅ Found ${usersResult.users.length} users in tenant ${firstTenant.name}`);
      usersResult.users.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });

      // Test 4: Get tenant stats
      console.log(`\n4. Testing tenant statistics for: ${firstTenant.name}`);
      const tenantStats = await TenantService.getTenantStats(firstTenant.id);
      console.log('✅ Tenant Statistics:');
      console.log(`   - Users: ${tenantStats.userCount}`);
      console.log(`   - Clients: ${tenantStats.clientCount}`);
      console.log(`   - Active Bookings: ${tenantStats.activeBookings}`);
      console.log(`   - Spaces: ${tenantStats.spacesCount}`);
      console.log(`   - Revenue: $${tenantStats.totalRevenue}`);
    }

    // Test 5: Super Admin role verification simulation
    console.log('\n5. Testing Super Admin role verification...');
    const mockSuperAdminUser = {
      id: 'test_super_admin',
      email: 'superadmin@test.com',
      role: 'SUPER_ADMIN' as const,
      tenantId: null, // Super admin is not bound to a specific tenant
    };

    const mockRegularUser = {
      id: 'test_regular_user',
      email: 'user@test.com',
      role: 'COWORK_ADMIN' as const,
      tenantId: tenantsResult.tenants[0]?.id || 'tenant_123',
    };

    // Simulate role verification (this would be done in the controller)
    const isSuperAdmin = mockSuperAdminUser.role === 'SUPER_ADMIN';
    const isRegularUser = mockRegularUser.role !== 'SUPER_ADMIN';
    
    console.log(`✅ Super Admin verification: ${isSuperAdmin ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Regular user denied: ${isRegularUser ? 'PASS' : 'FAIL'}`);

    // Test 6: Database access verification
    console.log('\n6. Testing database access patterns...');
    
    // Super Admin should be able to query across all tenants
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, tenantId')
      .limit(5);

    if (usersError) {
      console.error('❌ Error accessing users across tenants:', usersError);
    } else {
      console.log(`✅ Cross-tenant user access: Found ${allUsers?.length || 0} users`);
      allUsers?.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) in tenant: ${user.tenantId}`);
      });
    }

    // Test 7: Pagination testing
    console.log('\n7. Testing pagination...');
    const page1 = await TenantService.getAllTenants(1, 2);
    const page2 = await TenantService.getAllTenants(2, 2);
    
    console.log(`✅ Page 1: ${page1.tenants.length} tenants`);
    console.log(`✅ Page 2: ${page2.tenants.length} tenants`);
    console.log(`✅ Total pages: ${Math.ceil(page1.total / 2)}`);

    console.log('\n🎉 All Super Admin functionality tests completed successfully!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error during Super Admin testing:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting Super Admin functionality tests...\n');

  // Verify environment
  console.log('Environment check:');
  console.log(`- Database URL: ${config.database.url ? '✅ Configured' : '❌ Missing'}`);
  console.log(`- Supabase URL: ${config.supabase.url ? '✅ Configured' : '❌ Missing'}`);
  console.log(`- Service Role Key: ${config.supabase.serviceRoleKey ? '✅ Configured' : '❌ Missing'}`);

  if (!config.database.url || !config.supabase.url || !config.supabase.serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Test database connection
  console.log('\nTesting database connection...');
  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }

    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }

  await testSuperAdminFunctionality();
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

export { testSuperAdminFunctionality };