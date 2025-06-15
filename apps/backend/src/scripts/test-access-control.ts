import { supabase } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { accessControlService } from '../services/accessControlService';
import { QRCodeType, AccessZoneType, ScanResult } from '@prisma/client';

// Test configuration
const TEST_TENANT_ID = 'test-tenant-' + Date.now();
const TEST_USER_EMAIL = 'test-access@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

interface TestUser {
  id: string;
  email: string;
  tenantId: string;
}

async function setupTestData(): Promise<TestUser> {
  console.log('🔧 Setting up test data...');
  
  // Create test tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: TEST_TENANT_ID,
      name: 'Test Access Control Tenant',
      slug: 'test-access-' + Date.now(),
      status: 'ACTIVE'
    }
  });
  console.log('✅ Created test tenant:', tenant.name);

  // Create test user in Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  // Create test user in database
  const user = await prisma.user.create({
    data: {
      tenantId: TEST_TENANT_ID,
      supabaseId: authData.user!.id,
      email: TEST_USER_EMAIL,
      firstName: 'Test',
      lastName: 'User',
      role: 'COWORK_ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Created test user:', user.email);

  return user;
}

async function testQRCodeGeneration(user: TestUser) {
  console.log('\n📱 Testing QR Code Generation...');
  
  try {
    // Test 1: Generate member QR code
    const memberQR = await accessControlService.generateQRCode(user.tenantId, {
      type: QRCodeType.MEMBER,
      userId: user.id,
      validFor: 24, // 24 hours
      permissions: ['general_access', 'meeting_rooms'],
      maxScans: 10
    });
    
    console.log('✅ Generated member QR code:', {
      id: memberQR.id,
      type: memberQR.type,
      validUntil: memberQR.validUntil,
      permissions: memberQR.permissions
    });

    // Test 2: Generate visitor QR code
    const visitor = await prisma.visitor.create({
      data: {
        tenantId: user.tenantId,
        name: 'John Visitor',
        email: 'visitor@example.com',
        hostUserId: user.id,
        purpose: 'Business meeting',
        qrCode: 'visitor-' + Date.now(),
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        status: 'APPROVED'
      }
    });

    const visitorQR = await accessControlService.generateQRCode(user.tenantId, {
      type: QRCodeType.VISITOR,
      visitorId: visitor.id,
      validFor: 4, // 4 hours
      permissions: ['general_access'],
      maxScans: 2
    });

    console.log('✅ Generated visitor QR code:', {
      id: visitorQR.id,
      type: visitorQR.type,
      validUntil: visitorQR.validUntil
    });

    return { memberQR, visitorQR, visitor };
  } catch (error) {
    console.error('❌ QR Code generation failed:', error);
    throw error;
  }
}

async function testAccessZonesAndRules(user: TestUser) {
  console.log('\n🏢 Testing Access Zones and Rules...');
  
  try {
    // Create access zones
    const generalZone = await prisma.accessZone.create({
      data: {
        tenantId: user.tenantId,
        name: 'General Coworking Area',
        description: 'Open workspace for all members',
        zoneType: AccessZoneType.GENERAL,
        restrictions: {
          hours: { start: '08:00', end: '20:00' }
        },
        isActive: true
      }
    });

    const meetingRoom = await prisma.accessZone.create({
      data: {
        tenantId: user.tenantId,
        name: 'Meeting Room A',
        description: 'Premium meeting room',
        zoneType: AccessZoneType.MEETING_ROOM,
        restrictions: {
          requiresBooking: true,
          maxOccupancy: 8
        },
        isActive: true
      }
    });

    console.log('✅ Created access zones:', [generalZone.name, meetingRoom.name]);

    // Create access rules
    const generalAccessRule = await accessControlService.createAccessRule(user.tenantId, {
      name: 'General Access Hours',
      description: 'Standard working hours access',
      zoneId: generalZone.id,
      membershipTypes: ['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE'],
      planTypes: [],
      userRoles: ['END_USER', 'CLIENT_ADMIN', 'COWORK_ADMIN'],
      timeRestrictions: {
        start: '08:00',
        end: '20:00'
      },
      dayRestrictions: [1, 2, 3, 4, 5], // Monday to Friday
      maxOccupancy: 50,
      requiresApproval: false,
      priority: 1
    });

    const meetingRoomRule = await accessControlService.createAccessRule(user.tenantId, {
      name: 'Meeting Room Access',
      description: 'Requires booking and premium membership',
      zoneId: meetingRoom.id,
      membershipTypes: ['DEDICATED_DESK', 'PRIVATE_OFFICE'],
      planTypes: [],
      userRoles: ['END_USER', 'CLIENT_ADMIN', 'COWORK_ADMIN'],
      timeRestrictions: {
        start: '09:00',
        end: '18:00'
      },
      dayRestrictions: [1, 2, 3, 4, 5], // Monday to Friday
      maxOccupancy: 8,
      requiresApproval: true,
      priority: 2
    });

    console.log('✅ Created access rules:', [generalAccessRule.name, meetingRoomRule.name]);

    return { generalZone, meetingRoom, generalAccessRule, meetingRoomRule };
  } catch (error) {
    console.error('❌ Access zones/rules creation failed:', error);
    throw error;
  }
}

async function testQRCodeScanning(user: TestUser, qrData: any) {
  console.log('\n🔍 Testing QR Code Scanning...');
  
  try {
    // Test 1: Valid scan
    console.log('Testing valid scan...');
    const validScan = await accessControlService.scanQRCode(user.tenantId, {
      qrCodeData: qrData.memberQR.code,
      location: 'Main Entrance',
      deviceInfo: {
        deviceId: 'scanner-001',
        type: 'mobile'
      }
    });

    console.log('✅ Valid scan result:', {
      success: validScan.success,
      accessGranted: validScan.accessGranted,
      userInfo: validScan.userInfo
    });

    // Test 2: Scan with wrong tenant
    console.log('\nTesting scan with wrong tenant...');
    try {
      await accessControlService.scanQRCode('wrong-tenant-id', {
        qrCodeData: qrData.memberQR.code,
        location: 'Main Entrance'
      });
      console.log('❌ Should have failed with wrong tenant');
    } catch (error) {
      console.log('✅ Correctly rejected scan with wrong tenant');
    }

    // Test 3: Scan expired QR code
    console.log('\nTesting expired QR code...');
    // Create an expired QR code
    const expiredQR = await prisma.qRCode.create({
      data: {
        tenantId: user.tenantId,
        code: 'expired-code-' + Date.now(),
        type: QRCodeType.TEMPORARY,
        userId: user.id,
        permissions: ['general_access'],
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        status: 'ACTIVE',
        currentScans: 0
      }
    });

    const expiredScan = await accessControlService.scanQRCode(user.tenantId, {
      qrCodeData: expiredQR.code,
      location: 'Main Entrance'
    });

    console.log('✅ Expired scan result:', {
      success: expiredScan.success,
      result: expiredScan.result,
      message: expiredScan.message
    });

    return { validScan, expiredScan };
  } catch (error) {
    console.error('❌ QR Code scanning failed:', error);
    throw error;
  }
}

async function testOccupancyTracking(user: TestUser, zones: any) {
  console.log('\n📊 Testing Occupancy Tracking...');
  
  try {
    // Update occupancy for general zone
    const entry1 = await accessControlService.updateOccupancy(user.tenantId, {
      zoneId: zones.generalZone.id,
      action: 'ENTRY',
      timestamp: new Date()
    });

    console.log('✅ Recorded entry:', {
      zoneId: entry1.zoneId,
      currentCount: entry1.currentCount
    });

    // Add more entries
    for (let i = 0; i < 5; i++) {
      await accessControlService.updateOccupancy(user.tenantId, {
        zoneId: zones.generalZone.id,
        action: 'ENTRY',
        timestamp: new Date()
      });
    }

    // Get current occupancy
    const occupancy = await accessControlService.getCurrentOccupancy(
      user.tenantId,
      zones.generalZone.id
    );

    console.log('✅ Current occupancy:', occupancy.map(o => ({
      zone: o.zone?.name,
      currentCount: o.currentCount,
      maxCapacity: o.maxCapacity,
      percentage: Math.round((o.currentCount / o.maxCapacity) * 100) + '%'
    })));

    // Record some exits
    for (let i = 0; i < 3; i++) {
      await accessControlService.updateOccupancy(user.tenantId, {
        zoneId: zones.generalZone.id,
        action: 'EXIT',
        timestamp: new Date()
      });
    }

    const updatedOccupancy = await accessControlService.getCurrentOccupancy(
      user.tenantId,
      zones.generalZone.id
    );

    console.log('✅ Updated occupancy after exits:', updatedOccupancy[0]?.currentCount);

    return updatedOccupancy;
  } catch (error) {
    console.error('❌ Occupancy tracking failed:', error);
    throw error;
  }
}

async function testAccessLogs(user: TestUser) {
  console.log('\n📋 Testing Access Logs...');
  
  try {
    // Create some access logs
    const logs = [];
    for (let i = 0; i < 5; i++) {
      const log = await prisma.accessLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: i % 2 === 0 ? 'ENTRY' : 'EXIT',
          location: `Zone ${i + 1}`,
          timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // Stagger by hours
          metadata: {
            deviceId: `scanner-00${i}`,
            method: 'qr_code'
          }
        }
      });
      logs.push(log);
    }

    // Query access logs
    const accessLogs = await accessControlService.getAccessLogs(user.tenantId, {
      userId: user.id,
      limit: 10
    });

    console.log('✅ Retrieved access logs:', accessLogs.length);
    console.log('Latest entries:', accessLogs.slice(0, 3).map(log => ({
      action: log.action,
      location: log.location,
      timestamp: log.timestamp,
      user: log.user?.email
    })));

    return accessLogs;
  } catch (error) {
    console.error('❌ Access log retrieval failed:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.accessViolation.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.qRCodeScan.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.qRCode.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.occupancyTracking.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.accessLog.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.accessRule.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.accessZone.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.visitor.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.user.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.tenant.deleteMany({ where: { id: TEST_TENANT_ID } });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Access Control Tests\n');
  
  let testUser: TestUser | null = null;
  
  try {
    // Setup
    testUser = await setupTestData();
    
    // Run tests
    const qrData = await testQRCodeGeneration(testUser);
    const zones = await testAccessZonesAndRules(testUser);
    await testQRCodeScanning(testUser, qrData);
    await testOccupancyTracking(testUser, zones);
    await testAccessLogs(testUser);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

// Run the tests
runTests().catch(console.error);