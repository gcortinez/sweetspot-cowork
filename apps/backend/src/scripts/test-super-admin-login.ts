#!/usr/bin/env ts-node

/**
 * Test script for Super Admin login functionality
 * This script tests the login flow for super admin users
 */

import { AuthService } from '../services/authService';
import { prisma } from '../lib/prisma';

async function testSuperAdminLogin() {
  console.log('🔧 Testing Super Admin Login Functionality');
  console.log('=====================================');

  const email = 'gcortinez@getsweetspot.io';
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Please provide password as argument: npm run script:test-login <password>');
    process.exit(1);
  }

  try {
    // First, verify the user exists in database
    console.log('\n1. Checking user in database...');
    const userRecord = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!userRecord) {
      console.error('❌ User not found in database');
      process.exit(1);
    }

    console.log('✅ User found in database:');
    console.log(`   - ID: ${userRecord.id}`);
    console.log(`   - Email: ${userRecord.email}`);
    console.log(`   - Name: ${userRecord.firstName} ${userRecord.lastName}`);
    console.log(`   - Role: ${userRecord.role}`);
    console.log(`   - Status: ${userRecord.status}`);
    console.log(`   - Tenant ID: ${userRecord.tenantId}`);
    console.log(`   - Tenant: ${userRecord.tenant ? userRecord.tenant.name : 'No tenant (global super admin)'}`);

    // Test login without tenant slug (for super admin)
    console.log('\n2. Testing login without tenant slug...');
    try {
      const loginResult = await AuthService.login(email, password);
      
      console.log('✅ Login successful!');
      console.log(`   - User ID: ${loginResult.user.id}`);
      console.log(`   - Email: ${loginResult.user.email}`);
      console.log(`   - Role: ${loginResult.user.role}`);
      console.log(`   - Tenant: ${loginResult.tenant ? loginResult.tenant.name : 'No tenant (global access)'}`);
      console.log(`   - Access Token: ${loginResult.accessToken.substring(0, 20)}...`);
      console.log(`   - Refresh Token: ${loginResult.refreshToken ? loginResult.refreshToken.substring(0, 20) + '...' : 'None'}`);
      
      // Test session validation
      console.log('\n3. Testing session validation...');
      const sessionResult = await AuthService.getSession(loginResult.accessToken);
      
      if (sessionResult.isValid) {
        console.log('✅ Session is valid!');
        console.log(`   - User: ${sessionResult.user?.email}`);
        console.log(`   - Tenant: ${sessionResult.tenant ? sessionResult.tenant.name : 'No tenant'}`);
      } else {
        console.log('❌ Session validation failed');
      }
      
    } catch (loginError: any) {
      console.error('❌ Login failed:', loginError.message);
      console.error('   Full error:', loginError);
    }

    // Test login with a specific tenant slug if user has multiple tenants
    console.log('\n4. Checking for multiple tenant associations...');
    const userTenants = await prisma.user.findMany({
      where: { email },
      include: { tenant: true }
    });

    console.log(`   Found ${userTenants.length} user record(s) with this email`);
    userTenants.forEach((user, index) => {
      console.log(`   ${index + 1}. Tenant: ${user.tenant ? `${user.tenant.name} (${user.tenant.slug})` : 'None'}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSuperAdminLogin().catch(console.error);