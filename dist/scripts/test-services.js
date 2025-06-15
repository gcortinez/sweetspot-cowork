"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const tenantService_js_1 = require("../services/tenantService.js");
const userService_js_1 = require("../services/userService.js");
const clientService_js_1 = require("../services/clientService.js");
dotenv_1.default.config({ path: ".env.local" });
async function testServices() {
    console.log("🧪 Testing Supabase Services...\n");
    try {
        console.log("1. Testing Tenant Service...");
        const tenantData = {
            name: "Test Services Cowork",
            slug: "test-services-cowork",
            domain: "test-services.example.com",
            description: "Test tenant for service testing",
            adminUser: {
                email: "admin@test-services.com",
                password: "TestPassword123!",
                firstName: "Admin",
                lastName: "User",
            },
        };
        const tenant = await tenantService_js_1.TenantService.createTenant(tenantData);
        console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
        console.log("\n2. Testing Client Service...");
        const clientData = {
            name: "Test Client Corp",
            email: "client@test-services.com",
            tenantId: tenant.id,
            phone: "+1-555-0123",
            contactPerson: "John Client",
            status: "ACTIVE",
        };
        const client = await clientService_js_1.ClientService.createClient(clientData);
        console.log(`✅ Created client: ${client.name} (${client.id})`);
        console.log("\n3. Testing User Service...");
        const adminUser = await userService_js_1.UserService.getUserByEmail("admin@test-services.com", tenant.id);
        if (!adminUser) {
            throw new Error("Admin user not found after tenant creation");
        }
        console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);
        const clientUserData = {
            email: "user@test-services.com",
            password: "TestPassword123!",
            firstName: "Client",
            lastName: "User",
            tenantId: tenant.id,
            role: "END_USER",
            clientId: client.id,
        };
        const clientUser = await userService_js_1.UserService.createUser(clientUserData);
        console.log(`✅ Created client user: ${clientUser.email} (${clientUser.id})`);
        console.log("\n4. Testing Data Retrieval...");
        const tenantBySlug = await tenantService_js_1.TenantService.getTenantBySlug(tenant.slug);
        console.log(`✅ Retrieved tenant by slug: ${tenantBySlug?.name}`);
        const tenantStats = await tenantService_js_1.TenantService.getTenantStats(tenant.id);
        console.log(`✅ Tenant stats: ${tenantStats.userCount} users, ${tenantStats.clientCount} clients`);
        const usersResult = await userService_js_1.UserService.getUsersByTenant(tenant.id, 1, 10);
        console.log(`✅ Retrieved ${usersResult.users.length} users for tenant`);
        const userStats = await userService_js_1.UserService.getUserStats(tenant.id);
        console.log(`✅ User stats: ${userStats.totalUsers} total, ${userStats.activeUsers} active`);
        const clientsResult = await clientService_js_1.ClientService.getClientsByTenant(tenant.id, 1, 10);
        console.log(`✅ Retrieved ${clientsResult.clients.length} clients for tenant`);
        const clientStats = await clientService_js_1.ClientService.getClientStats(tenant.id);
        console.log(`✅ Client stats: ${clientStats.totalClients} total, ${clientStats.activeClients} active`);
        console.log("\n5. Testing Updates...");
        const updatedTenant = await tenantService_js_1.TenantService.updateTenant(tenant.id, {
            description: "Updated description for service test",
        });
        console.log(`✅ Updated tenant description`);
        const updatedUser = await userService_js_1.UserService.updateUser(clientUser.id, {
            phone: "+1-555-9999",
        });
        console.log(`✅ Updated user phone number to: ${updatedUser.phone}`);
        const updatedClient = await clientService_js_1.ClientService.updateClient(client.id, {
            status: "PROSPECT",
        });
        console.log(`✅ Updated client status to: ${updatedClient.status}`);
        console.log("\n6. Testing Search and Filtering...");
        const adminUsers = await userService_js_1.UserService.getUsersByTenant(tenant.id, 1, 10, "COWORK_ADMIN");
        console.log(`✅ Found ${adminUsers.users.length} admin users`);
        const prospectClients = await clientService_js_1.ClientService.getClientsByTenant(tenant.id, 1, 10, "PROSPECT");
        console.log(`✅ Found ${prospectClients.clients.length} prospect clients`);
        const searchResults = await clientService_js_1.ClientService.getClientsByTenant(tenant.id, 1, 10, undefined, "Test Client");
        console.log(`✅ Search found ${searchResults.clients.length} clients matching 'Test Client'`);
        console.log("\n7. Testing Status Management...");
        const suspendedUser = await userService_js_1.UserService.suspendUser(clientUser.id);
        console.log(`✅ Suspended user: ${suspendedUser.status}`);
        const activatedUser = await userService_js_1.UserService.activateUser(clientUser.id);
        console.log(`✅ Activated user: ${activatedUser.status}`);
        const activatedClient = await clientService_js_1.ClientService.activateClient(client.id);
        console.log(`✅ Activated client: ${activatedClient.status}`);
        console.log("\n8. Testing Cleanup...");
        await userService_js_1.UserService.deleteUser(adminUser.id, true);
        await userService_js_1.UserService.deleteUser(clientUser.id, true);
        console.log(`✅ Deleted test users`);
        await clientService_js_1.ClientService.deleteClient(client.id, true);
        console.log(`✅ Deleted test client`);
        await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        console.log(`✅ Deleted test tenant`);
        console.log("\n🎉 All service tests passed successfully!");
    }
    catch (error) {
        console.error("\n❌ Service test failed:", error);
        process.exit(1);
    }
}
testServices()
    .then(() => {
    console.log("\n✅ Service test completed successfully");
    process.exit(0);
})
    .catch((error) => {
    console.error("\n❌ Service test failed:", error);
    process.exit(1);
});
//# sourceMappingURL=test-services.js.map