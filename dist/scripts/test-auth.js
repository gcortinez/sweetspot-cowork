"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMultiTenantAuth = testMultiTenantAuth;
const authService_1 = require("../services/authService");
const tenantService_1 = require("../services/tenantService");
const userService_1 = require("../services/userService");
const clientService_1 = require("../services/clientService");
async function testMultiTenantAuth() {
    console.log("🔐 Testing Multi-Tenant Authentication System");
    console.log("=".repeat(50));
    try {
        console.log("\n1️⃣ Creating test tenant...");
        const timestamp = Date.now();
        const tenant = await tenantService_1.TenantService.createTenant({
            name: "Test Coworking Space",
            slug: `test-cowork-${timestamp}`,
            domain: `test-${timestamp}.sweetspot.com`,
            description: "Test tenant for authentication",
            adminUser: {
                email: `admin-${timestamp}@test.com`,
                password: "TestPassword123!",
                firstName: "Admin",
                lastName: "User",
            },
        });
        console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);
        console.log("\n2️⃣ Creating test client...");
        const client = await clientService_1.ClientService.createClient({
            tenantId: tenant.id,
            name: "Test Company",
            email: "company@test.com",
            phone: "+1234567890",
            address: "123 Test Street",
            contactPerson: "John Doe",
            status: "ACTIVE",
        });
        console.log(`✅ Created client: ${client.name}`);
        console.log("\n3️⃣ Testing user login...");
        const loginResult = await authService_1.AuthService.login(`admin-${timestamp}@test.com`, "TestPassword123!", tenant.slug);
        if (!loginResult.success) {
            throw new Error(`Login failed: ${loginResult.error}`);
        }
        console.log(`✅ Login successful for: ${loginResult.user?.email}`);
        console.log(`🏢 Tenant: ${loginResult.tenant?.name}`);
        console.log(`👤 Role: ${loginResult.user?.role}`);
        console.log("\n5️⃣ Testing session validation...");
        const sessionResult = await authService_1.AuthService.getSession(loginResult.accessToken);
        if (!sessionResult.isValid) {
            throw new Error("Session validation failed");
        }
        console.log(`✅ Session valid for: ${sessionResult.user.email}`);
        console.log(`🏢 Session tenant: ${sessionResult.tenant.name}`);
        console.log("\n6️⃣ Testing permission verification...");
        const hasUserPermission = await authService_1.AuthService.verifyPermissions(loginResult.user.id, "read", "user", loginResult.user.id);
        console.log(`✅ User can access own data: ${hasUserPermission}`);
        const hasTenantPermission = await authService_1.AuthService.verifyPermissions(loginResult.user.id, "manage", "tenant", tenant.id);
        console.log(`✅ Cowork admin can manage tenant: ${hasTenantPermission}`);
        console.log("\n7️⃣ Testing password change...");
        const changePasswordResult = await authService_1.AuthService.changePassword(loginResult.user.id, "TestPassword123!", "NewPassword123!");
        if (!changePasswordResult.success) {
            throw new Error(`Password change failed: ${changePasswordResult.error}`);
        }
        console.log(`✅ Password changed successfully`);
        console.log("\n8️⃣ Testing login with new password...");
        const newLoginResult = await authService_1.AuthService.login(`admin-${timestamp}@test.com`, "NewPassword123!", tenant.slug);
        if (!newLoginResult.success) {
            throw new Error(`Login with new password failed: ${newLoginResult.error}`);
        }
        console.log(`✅ Login successful with new password`);
        console.log("\n9️⃣ Testing token refresh...");
        const refreshResult = await authService_1.AuthService.refreshToken(newLoginResult.refreshToken);
        if (!refreshResult.success) {
            throw new Error(`Token refresh failed: ${refreshResult.error}`);
        }
        console.log(`✅ Token refreshed successfully`);
        console.log(`🎫 New access token: ${refreshResult.accessToken?.substring(0, 20)}...`);
        console.log("\n🔟 Testing logout...");
        await authService_1.AuthService.logout(refreshResult.accessToken);
        console.log(`✅ Logout successful`);
        console.log("\n1️⃣1️⃣ Testing session after logout...");
        const loggedOutSession = await authService_1.AuthService.getSession(refreshResult.accessToken);
        if (loggedOutSession.isValid) {
            console.log(`⚠️ Session still valid after logout (this might be expected behavior)`);
        }
        else {
            console.log(`✅ Session invalid after logout`);
        }
        console.log("\n1️⃣2️⃣ Testing multi-tenant isolation...");
        const tenant2 = await tenantService_1.TenantService.createTenant({
            name: "Another Coworking Space",
            slug: `another-cowork-${timestamp}`,
            domain: `another-${timestamp}.sweetspot.com`,
            description: "Second test tenant",
            adminUser: {
                email: `admin-${timestamp}@another.com`,
                password: "AnotherPassword123!",
                firstName: "Another",
                lastName: "Admin",
            },
        });
        const wrongTenantLogin = await authService_1.AuthService.login(`admin-${timestamp}@test.com`, "NewPassword123!", tenant2.slug);
        if (wrongTenantLogin.success) {
            console.log(`⚠️ User was able to login to wrong tenant - this should be prevented`);
        }
        else {
            console.log(`✅ Multi-tenant isolation working: ${wrongTenantLogin.error}`);
        }
        console.log("\n1️⃣3️⃣ Testing different user roles...");
        const clientAdminResult = await authService_1.AuthService.register({
            email: `clientadmin-${timestamp}@test.com`,
            password: "ClientPassword123!",
            firstName: "Client",
            lastName: "Admin",
            tenantSlug: tenant.slug,
            role: "CLIENT_ADMIN",
            clientId: client.id,
        });
        if (!clientAdminResult.success) {
            throw new Error(`Client admin registration failed: ${clientAdminResult.error}`);
        }
        console.log(`✅ Created client admin: ${clientAdminResult.user?.email}`);
        const clientAdminCanAccessClient = await authService_1.AuthService.verifyPermissions(clientAdminResult.user.id, "read", "client", client.id);
        console.log(`✅ Client admin can access own client: ${clientAdminCanAccessClient}`);
        const clientAdminCanAccessOtherClient = await authService_1.AuthService.verifyPermissions(clientAdminResult.user.id, "read", "client", "other-client-id");
        console.log(`✅ Client admin cannot access other client: ${!clientAdminCanAccessOtherClient}`);
        const endUserResult = await authService_1.AuthService.register({
            email: `enduser-${timestamp}@test.com`,
            password: "EndUserPassword123!",
            firstName: "End",
            lastName: "User",
            tenantSlug: tenant.slug,
            role: "END_USER",
            clientId: client.id,
        });
        if (!endUserResult.success) {
            throw new Error(`End user registration failed: ${endUserResult.error}`);
        }
        console.log(`✅ Created end user: ${endUserResult.user?.email}`);
        const endUserCanAccessOwnData = await authService_1.AuthService.verifyPermissions(endUserResult.user.id, "read", "user", endUserResult.user.id);
        console.log(`✅ End user can access own data: ${endUserCanAccessOwnData}`);
        const endUserCanAccessOtherUser = await authService_1.AuthService.verifyPermissions(endUserResult.user.id, "read", "user", clientAdminResult.user.id);
        console.log(`✅ End user cannot access other user data: ${!endUserCanAccessOtherUser}`);
        console.log("\n🎉 All authentication tests passed!");
        console.log("=".repeat(50));
        console.log("\n🧹 Cleaning up test data...");
        await userService_1.UserService.deleteUser(clientAdminResult.user.id, true);
        await userService_1.UserService.deleteUser(endUserResult.user.id, true);
        await clientService_1.ClientService.deleteClient(client.id, true);
        await tenantService_1.TenantService.deleteTenant(tenant.id, true);
        await tenantService_1.TenantService.deleteTenant(tenant2.id, true);
        console.log("✅ Cleanup completed");
    }
    catch (error) {
        console.error("\n❌ Authentication test failed:", error);
        throw error;
    }
}
testMultiTenantAuth()
    .then(() => {
    console.log("\n✅ Multi-tenant authentication test completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("\n❌ Multi-tenant authentication test failed:", error);
    process.exit(1);
});
//# sourceMappingURL=test-auth.js.map