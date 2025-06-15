"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TEST_EMAIL = 'test-access-api@example.com';
const TEST_PASSWORD = 'TestPassword123!';
function createApiClient(token) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return axios_1.default.create({
        baseURL: `${API_BASE_URL}/api`,
        headers,
        validateStatus: () => true
    });
}
async function setupTestUser() {
    console.log('🔧 Setting up test user...\n');
    const api = createApiClient();
    try {
        let loginResponse = await api.post('/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        if (loginResponse.status !== 200) {
            console.log('Registering new test user...');
            const registerResponse = await api.post('/auth/register', {
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                firstName: 'Access',
                lastName: 'Tester',
                tenantName: 'Access Control Test Tenant'
            });
            if (registerResponse.status !== 201) {
                throw new Error(`Registration failed: ${JSON.stringify(registerResponse.data)}`);
            }
            loginResponse = await api.post('/auth/login', {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
        }
        const { token, user } = loginResponse.data.data;
        console.log('✅ Authenticated as:', user.email);
        return {
            api: createApiClient(token),
            token,
            userId: user.id,
            tenantId: user.tenantId
        };
    }
    catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }
}
async function testQRCodeEndpoints(ctx) {
    console.log('\n📱 Testing QR Code Endpoints...\n');
    console.log('1️⃣ POST /access-control/qr-codes - Generate QR Code');
    const generateResponse = await ctx.api.post('/access-control/qr-codes', {
        type: 'MEMBER',
        userId: ctx.userId,
        validFor: 24,
        permissions: ['general_access', 'meeting_rooms'],
        maxScans: 10
    });
    console.log(`   Status: ${generateResponse.status}`);
    console.log(`   Success: ${generateResponse.data.success}`);
    if (generateResponse.status === 200) {
        const qrCode = generateResponse.data.data;
        console.log(`   QR Code ID: ${qrCode.id}`);
        console.log(`   Valid Until: ${qrCode.validUntil}`);
        console.log(`   ✅ QR Code generated successfully`);
        console.log('\n2️⃣ GET /access-control/my-qr-codes - Get My QR Codes');
        const myQRResponse = await ctx.api.get('/access-control/my-qr-codes');
        console.log(`   Status: ${myQRResponse.status}`);
        console.log(`   QR Codes Found: ${myQRResponse.data.data?.length || 0}`);
        console.log('\n3️⃣ POST /access-control/qr-codes/scan - Scan QR Code');
        const scanResponse = await ctx.api.post('/access-control/qr-codes/scan', {
            qrCodeData: qrCode.code,
            location: 'Main Entrance'
        });
        console.log(`   Status: ${scanResponse.status}`);
        console.log(`   Access Granted: ${scanResponse.data.data?.accessGranted}`);
        console.log('\n4️⃣ GET /access-control/qr-codes/scans - Get Scan History');
        const scansResponse = await ctx.api.get('/access-control/qr-codes/scans');
        console.log(`   Status: ${scansResponse.status}`);
        console.log(`   Scans Found: ${scansResponse.data.data?.length || 0}`);
        console.log('\n5️⃣ DELETE /access-control/qr-codes/:id - Revoke QR Code');
        const revokeResponse = await ctx.api.delete(`/access-control/qr-codes/${qrCode.id}`);
        console.log(`   Status: ${revokeResponse.status}`);
        console.log(`   Success: ${revokeResponse.data.success}`);
        return qrCode;
    }
    else {
        console.log(`   ❌ Failed: ${JSON.stringify(generateResponse.data)}`);
    }
}
async function testAccessZoneEndpoints(ctx) {
    console.log('\n🏢 Testing Access Zone Endpoints...\n');
    console.log('1️⃣ POST /access-control/access-zones - Create Access Zone');
    const createZoneResponse = await ctx.api.post('/access-control/access-zones', {
        name: 'Test Zone',
        description: 'Test access zone',
        zoneType: 'GENERAL',
        restrictions: { hours: { start: '08:00', end: '18:00' } },
        isActive: true
    });
    console.log(`   Status: ${createZoneResponse.status}`);
    console.log(`   Success: ${createZoneResponse.data.success}`);
    if (createZoneResponse.status === 201) {
        const zone = createZoneResponse.data.data;
        console.log(`   Zone ID: ${zone.id}`);
        console.log(`   ✅ Zone created successfully`);
        console.log('\n2️⃣ GET /access-control/access-zones - Get All Zones');
        const getZonesResponse = await ctx.api.get('/access-control/access-zones');
        console.log(`   Status: ${getZonesResponse.status}`);
        console.log(`   Zones Found: ${getZonesResponse.data.data?.length || 0}`);
        console.log('\n3️⃣ PUT /access-control/access-zones/:id - Update Zone');
        const updateResponse = await ctx.api.put(`/access-control/access-zones/${zone.id}`, {
            description: 'Updated test zone'
        });
        console.log(`   Status: ${updateResponse.status}`);
        console.log(`   Success: ${updateResponse.data.success}`);
        return zone;
    }
    else {
        console.log(`   ❌ Failed: ${JSON.stringify(createZoneResponse.data)}`);
    }
}
async function testAccessRuleEndpoints(ctx, zoneId) {
    console.log('\n📋 Testing Access Rule Endpoints...\n');
    console.log('1️⃣ POST /access-control/access-rules - Create Access Rule');
    const createRuleResponse = await ctx.api.post('/access-control/access-rules', {
        name: 'Test Rule',
        description: 'Test access rule',
        zoneId: zoneId,
        membershipTypes: ['HOT_DESK'],
        planTypes: [],
        userRoles: ['END_USER'],
        timeRestrictions: { start: '08:00', end: '18:00' },
        dayRestrictions: [1, 2, 3, 4, 5],
        requiresApproval: false,
        priority: 1
    });
    console.log(`   Status: ${createRuleResponse.status}`);
    console.log(`   Success: ${createRuleResponse.data.success}`);
    if (createRuleResponse.status === 201) {
        const rule = createRuleResponse.data.data;
        console.log(`   Rule ID: ${rule.id}`);
        console.log(`   ✅ Rule created successfully`);
        console.log('\n2️⃣ GET /access-control/access-rules - Get All Rules');
        const getRulesResponse = await ctx.api.get('/access-control/access-rules');
        console.log(`   Status: ${getRulesResponse.status}`);
        console.log(`   Rules Found: ${getRulesResponse.data.data?.length || 0}`);
        console.log('\n3️⃣ PUT /access-control/access-rules/:id - Update Rule');
        const updateResponse = await ctx.api.put(`/access-control/access-rules/${rule.id}`, {
            priority: 2
        });
        console.log(`   Status: ${updateResponse.status}`);
        console.log(`   Success: ${updateResponse.data.success}`);
        console.log('\n4️⃣ DELETE /access-control/access-rules/:id - Delete Rule');
        const deleteResponse = await ctx.api.delete(`/access-control/access-rules/${rule.id}`);
        console.log(`   Status: ${deleteResponse.status}`);
        console.log(`   Success: ${deleteResponse.data.success}`);
        return rule;
    }
    else {
        console.log(`   ❌ Failed: ${JSON.stringify(createRuleResponse.data)}`);
    }
}
async function testOccupancyEndpoints(ctx) {
    console.log('\n📊 Testing Occupancy Endpoints...\n');
    console.log('1️⃣ GET /access-control/occupancy - Get Current Occupancy');
    const getOccupancyResponse = await ctx.api.get('/access-control/occupancy');
    console.log(`   Status: ${getOccupancyResponse.status}`);
    console.log(`   Success: ${getOccupancyResponse.data.success}`);
    console.log('\n2️⃣ POST /access-control/occupancy/update - Update Occupancy');
    const updateResponse = await ctx.api.post('/access-control/occupancy/update', {
        action: 'ENTRY'
    });
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Success: ${updateResponse.data.success}`);
}
async function testAccessLogEndpoints(ctx) {
    console.log('\n📋 Testing Access Log Endpoints...\n');
    console.log('1️⃣ GET /access-control/access-logs - Get Access Logs');
    const getLogsResponse = await ctx.api.get('/access-control/access-logs', {
        params: {
            limit: 10
        }
    });
    console.log(`   Status: ${getLogsResponse.status}`);
    console.log(`   Logs Found: ${getLogsResponse.data.data?.length || 0}`);
}
async function testViolationEndpoints(ctx) {
    console.log('\n⚠️ Testing Violation Endpoints...\n');
    console.log('1️⃣ GET /access-control/violations - Get Violations');
    const getViolationsResponse = await ctx.api.get('/access-control/violations', {
        params: {
            resolved: false
        }
    });
    console.log(`   Status: ${getViolationsResponse.status}`);
    console.log(`   Violations Found: ${getViolationsResponse.data.data?.length || 0}`);
}
async function runApiTests() {
    console.log('🚀 Access Control API Tests\n');
    console.log(`📍 API URL: ${API_BASE_URL}`);
    console.log('='.repeat(50) + '\n');
    try {
        const ctx = await setupTestUser();
        await testQRCodeEndpoints(ctx);
        const zone = await testAccessZoneEndpoints(ctx);
        await testAccessRuleEndpoints(ctx, zone?.id);
        await testOccupancyEndpoints(ctx);
        await testAccessLogEndpoints(ctx);
        await testViolationEndpoints(ctx);
        console.log('\n' + '='.repeat(50));
        console.log('✅ API tests completed!\n');
    }
    catch (error) {
        console.error('\n❌ API tests failed:', error);
        process.exit(1);
    }
}
async function checkServer() {
    try {
        const response = await axios_1.default.get(`${API_BASE_URL}/health`);
        if (response.status === 200) {
            console.log('✅ Server is running\n');
            return true;
        }
    }
    catch (error) {
        console.error('❌ Server is not running at', API_BASE_URL);
        console.error('Please start the server with: npm run dev\n');
        return false;
    }
}
async function main() {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runApiTests();
    }
}
main().catch(console.error);
//# sourceMappingURL=test-access-control-api.js.map