"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const JWT_SECRET = 'test-secret-key';
const TENANT_ID = 'test-tenant-123';
const CreateQRCodeSchema = zod_1.z.object({
    type: zod_1.z.enum(['MEMBER', 'VISITOR', 'TEMPORARY', 'SERVICE', 'EMERGENCY', 'ADMIN']),
    userId: zod_1.z.string().optional(),
    visitorId: zod_1.z.string().optional(),
    validFor: zod_1.z.number().min(1).max(168),
    permissions: zod_1.z.array(zod_1.z.string()),
    maxScans: zod_1.z.number().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const ScanQRCodeSchema = zod_1.z.object({
    qrCodeData: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    deviceInfo: zod_1.z.record(zod_1.z.any()).optional(),
    scannedBy: zod_1.z.string().optional()
});
const CreateAccessRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    zoneId: zod_1.z.string().optional(),
    membershipTypes: zod_1.z.array(zod_1.z.string()),
    planTypes: zod_1.z.array(zod_1.z.string()),
    userRoles: zod_1.z.array(zod_1.z.string()),
    timeRestrictions: zod_1.z.record(zod_1.z.any()),
    dayRestrictions: zod_1.z.array(zod_1.z.number().min(0).max(6)),
    maxOccupancy: zod_1.z.number().optional(),
    requiresApproval: zod_1.z.boolean(),
    priority: zod_1.z.number(),
    validFrom: zod_1.z.string().optional(),
    validTo: zod_1.z.string().optional()
});
async function testSchemaValidation() {
    console.log('🔍 Testing Schema Validation...\n');
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
    }
    catch (error) {
        console.log('❌ Valid request failed:', error);
    }
    console.log('\n2️⃣ Testing invalid QR code creation:');
    try {
        CreateQRCodeSchema.parse({
            type: 'MEMBER',
        });
        console.log('❌ Should have failed validation');
    }
    catch (error) {
        console.log('✅ Correctly rejected invalid request');
    }
    console.log('\n3️⃣ Testing invalid QR code type:');
    try {
        CreateQRCodeSchema.parse({
            type: 'INVALID_TYPE',
            validFor: 24,
            permissions: []
        });
        console.log('❌ Should have failed validation');
    }
    catch (error) {
        console.log('✅ Correctly rejected invalid type');
    }
    console.log('\n4️⃣ Testing valid scan request:');
    try {
        const validScan = ScanQRCodeSchema.parse({
            qrCodeData: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            location: 'Main Entrance',
            deviceInfo: { deviceId: 'scanner-001' }
        });
        console.log('✅ Valid scan request accepted');
    }
    catch (error) {
        console.log('❌ Valid scan failed:', error);
    }
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
    }
    catch (error) {
        console.log('❌ Valid rule failed:', error);
    }
}
async function testJWTGeneration() {
    console.log('\n🔐 Testing JWT Generation...\n');
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + (24 * 60 * 60 * 1000));
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
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
    console.log('✅ Generated JWT token:', token.substring(0, 50) + '...');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('✅ Token verified successfully');
        console.log('   Tenant ID:', decoded.tenantId);
        console.log('   Type:', decoded.type);
        console.log('   User ID:', decoded.userId);
        console.log('   Permissions:', decoded.permissions);
    }
    catch (error) {
        console.log('❌ Token verification failed:', error);
    }
    console.log('\n🔐 Testing expired token:');
    const expiredPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000) - 86400,
        exp: Math.floor(Date.now() / 1000) - 3600
    };
    const expiredToken = jsonwebtoken_1.default.sign(expiredPayload, JWT_SECRET, { algorithm: 'HS256' });
    try {
        jsonwebtoken_1.default.verify(expiredToken, JWT_SECRET);
        console.log('❌ Should have failed for expired token');
    }
    catch (error) {
        console.log('✅ Correctly rejected expired token:', error.message);
    }
}
async function testQRCodeGeneration() {
    console.log('\n📱 Testing QR Code Image Generation...\n');
    const token = 'test-qr-code-data-12345';
    try {
        const qrImageUrl = await qrcode_1.default.toDataURL(token, {
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
        const qrString = await qrcode_1.default.toString(token, { type: 'terminal', small: true });
        console.log('\n✅ Generated QR code ASCII:');
        console.log(qrString);
    }
    catch (error) {
        console.log('❌ QR code generation failed:', error);
    }
}
function testTimeRestrictions() {
    console.log('\n⏰ Testing Time Restrictions...\n');
    const parseTime = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };
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
    console.log('\n📅 Testing Day Restrictions:');
    const dayRestrictions = [1, 2, 3, 4, 5];
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
    console.log('='.repeat(50) + '\n');
    await testSchemaValidation();
    await testJWTGeneration();
    await testQRCodeGeneration();
    testTimeRestrictions();
    testPermissionMatching();
    console.log('\n' + '='.repeat(50));
    console.log('✅ Unit tests completed!\n');
}
runTests().catch(console.error);
//# sourceMappingURL=test-access-control-unit.js.map