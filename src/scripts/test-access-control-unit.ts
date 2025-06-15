import { z } from 'zod';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

// Mock environment
const JWT_SECRET = 'test-secret-key';
const TENANT_ID = 'test-tenant-123';

// Test validation schemas from the controller
const CreateQRCodeSchema = z.object({
  type: z.enum(['MEMBER', 'VISITOR', 'TEMPORARY', 'SERVICE', 'EMERGENCY', 'ADMIN']),
  userId: z.string().optional(),
  visitorId: z.string().optional(),
  validFor: z.number().min(1).max(168), // 1 hour to 1 week
  permissions: z.array(z.string()),
  maxScans: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

const ScanQRCodeSchema = z.object({
  qrCodeData: z.string().min(1),
  location: z.string().optional(),
  deviceInfo: z.record(z.any()).optional(),
  scannedBy: z.string().optional()
});

const CreateAccessRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  zoneId: z.string().optional(),
  membershipTypes: z.array(z.string()),
  planTypes: z.array(z.string()),
  userRoles: z.array(z.string()),
  timeRestrictions: z.record(z.any()),
  dayRestrictions: z.array(z.number().min(0).max(6)),
  maxOccupancy: z.number().optional(),
  requiresApproval: z.boolean(),
  priority: z.number(),
  validFrom: z.string().optional(),
  validTo: z.string().optional()
});

async function testSchemaValidation() {
  console.log('🔍 Testing Schema Validation...\n');
  
  // Test 1: Valid QR Code creation request
  console.log('1️⃣ Testing valid QR code creation:');
  try {
    const validRequest = CreateQRCodeSchema.parse({
      type: 'MEMBER',
      userId: 'user-123',
      validFor: 24,
      permissions: ['general_access', 'meeting_rooms'],
      maxScans: 10
    });
    console.log('✅ Valid QR code request accepted');
  } catch (error) {
    console.log('❌ Valid request failed:', error);
  }

  // Test 2: Invalid QR Code creation (missing required fields)
  console.log('\n2️⃣ Testing invalid QR code creation:');
  try {
    CreateQRCodeSchema.parse({
      type: 'MEMBER',
      // Missing validFor and permissions
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Correctly rejected invalid request');
  }

  // Test 3: Invalid QR Code type
  console.log('\n3️⃣ Testing invalid QR code type:');
  try {
    CreateQRCodeSchema.parse({
      type: 'INVALID_TYPE',
      validFor: 24,
      permissions: []
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Correctly rejected invalid type');
  }

  // Test 4: Valid scan request
  console.log('\n4️⃣ Testing valid scan request:');
  try {
    const validScan = ScanQRCodeSchema.parse({
      qrCodeData: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      location: 'Main Entrance',
      deviceInfo: { deviceId: 'scanner-001' }
    });
    console.log('✅ Valid scan request accepted');
  } catch (error) {
    console.log('❌ Valid scan failed:', error);
  }

  // Test 5: Valid access rule
  console.log('\n5️⃣ Testing valid access rule:');
  try {
    const validRule = CreateAccessRuleSchema.parse({
      name: 'General Access',
      membershipTypes: ['HOT_DESK', 'DEDICATED_DESK'],
      planTypes: [],
      userRoles: ['END_USER'],
      timeRestrictions: { start: '08:00', end: '18:00' },
      dayRestrictions: [1, 2, 3, 4, 5],
      requiresApproval: false,
      priority: 1
    });
    console.log('✅ Valid access rule accepted');
  } catch (error) {
    console.log('❌ Valid rule failed:', error);
  }
}

async function testJWTGeneration() {
  console.log('\n🔐 Testing JWT Generation...\n');
  
  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + (24 * 60 * 60 * 1000));
  
  // Create JWT payload
  const payload = {
    tenantId: TENANT_ID,
    type: 'MEMBER',
    userId: 'user-123',
    permissions: ['general_access', 'meeting_rooms'],
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(validUntil.getTime() / 1000)
  };

  // Generate token
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  console.log('✅ Generated JWT token:', token.substring(0, 50) + '...');

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token verified successfully');
    console.log('   Tenant ID:', decoded.tenantId);
    console.log('   Type:', decoded.type);
    console.log('   User ID:', decoded.userId);
    console.log('   Permissions:', decoded.permissions);
  } catch (error) {
    console.log('❌ Token verification failed:', error);
  }

  // Test expired token
  console.log('\n🔐 Testing expired token:');
  const expiredPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000) - 86400,
    exp: Math.floor(Date.now() / 1000) - 3600
  };
  const expiredToken = jwt.sign(expiredPayload, JWT_SECRET, { algorithm: 'HS256' });
  
  try {
    jwt.verify(expiredToken, JWT_SECRET);
    console.log('❌ Should have failed for expired token');
  } catch (error: any) {
    console.log('✅ Correctly rejected expired token:', error.message);
  }
}

async function testQRCodeGeneration() {
  console.log('\n📱 Testing QR Code Image Generation...\n');
  
  const token = 'test-qr-code-data-12345';
  
  try {
    // Generate QR code as data URL
    const qrImageUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('✅ Generated QR code data URL');
    console.log('   Length:', qrImageUrl.length);
    console.log('   Type:', qrImageUrl.substring(0, 30) + '...');
    
    // Generate QR code as string (ASCII)
    const qrString = await QRCode.toString(token, { type: 'terminal', small: true });
    console.log('\n✅ Generated QR code ASCII:');
    console.log(qrString);
  } catch (error) {
    console.log('❌ QR code generation failed:', error);
  }
}

function testTimeRestrictions() {
  console.log('\n⏰ Testing Time Restrictions...\n');
  
  // Helper function to parse time
  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Test cases
  const testCases = [
    { current: '09:30', start: '08:00', end: '18:00', expected: true },
    { current: '07:30', start: '08:00', end: '18:00', expected: false },
    { current: '18:30', start: '08:00', end: '18:00', expected: false },
    { current: '12:00', start: '08:00', end: '18:00', expected: true },
  ];
  
  testCases.forEach(({ current, start, end, expected }, index) => {
    const currentTime = parseTime(current);
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    
    const isAllowed = currentTime >= startTime && currentTime <= endTime;
    const passed = isAllowed === expected;
    
    console.log(`${index + 1}️⃣ Time ${current} between ${start}-${end}:`);
    console.log(`   Expected: ${expected}, Got: ${isAllowed} ${passed ? '✅' : '❌'}`);
  });
  
  // Test day restrictions
  console.log('\n📅 Testing Day Restrictions:');
  const dayRestrictions = [1, 2, 3, 4, 5]; // Monday to Friday
  const testDays = [
    { day: 0, name: 'Sunday', expected: false },
    { day: 1, name: 'Monday', expected: true },
    { day: 3, name: 'Wednesday', expected: true },
    { day: 6, name: 'Saturday', expected: false },
  ];
  
  testDays.forEach(({ day, name, expected }) => {
    const isAllowed = dayRestrictions.includes(day);
    const passed = isAllowed === expected;
    console.log(`   ${name}: Expected ${expected}, Got ${isAllowed} ${passed ? '✅' : '❌'}`);
  });
}

function testPermissionMatching() {
  console.log('\n🔒 Testing Permission Matching...\n');
  
  const testCases = [
    {
      required: ['general_access'],
      granted: ['general_access', 'meeting_rooms'],
      expected: true,
      description: 'User has required permission'
    },
    {
      required: ['general_access', 'admin_area'],
      granted: ['general_access'],
      expected: false,
      description: 'User missing one permission'
    },
    {
      required: [],
      granted: ['general_access'],
      expected: true,
      description: 'No permissions required'
    },
    {
      required: ['special_access'],
      granted: [],
      expected: false,
      description: 'User has no permissions'
    }
  ];
  
  testCases.forEach(({ required, granted, expected, description }, index) => {
    const hasAllPermissions = required.every(perm => granted.includes(perm));
    const passed = hasAllPermissions === expected;
    
    console.log(`${index + 1}️⃣ ${description}:`);
    console.log(`   Required: [${required.join(', ')}]`);
    console.log(`   Granted: [${granted.join(', ')}]`);
    console.log(`   Expected: ${expected}, Got: ${hasAllPermissions} ${passed ? '✅' : '❌'}`);
  });
}

async function runTests() {
  console.log('🚀 Access Control Unit Tests\n');
  console.log('=' .repeat(50) + '\n');
  
  await testSchemaValidation();
  await testJWTGeneration();
  await testQRCodeGeneration();
  testTimeRestrictions();
  testPermissionMatching();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Unit tests completed!\n');
}

// Run tests
runTests().catch(console.error);