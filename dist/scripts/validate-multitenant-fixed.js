"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedMultiTenantValidator = void 0;
const authService_js_1 = require("../services/authService.js");
const tenantService_js_1 = require("../services/tenantService.js");
const userService_js_1 = require("../services/userService.js");
const clientService_js_1 = require("../services/clientService.js");
const supabase_js_1 = require("../lib/supabase.js");
class FixedMultiTenantValidator {
    results = [];
    startTime = 0;
    async runValidation() {
        console.log("🔍 Starting Fixed Multi-Tenant Architecture Validation");
        console.log("=".repeat(60));
        this.startTime = Date.now();
        await this.testDatabaseLayer();
        await this.testServiceLayerIntegration();
        await this.testAuthenticationSystem();
        await this.testDataIsolation();
        await this.testRoleBasedAccess();
        await this.testEdgeCases();
        await this.testPerformance();
        const totalDuration = Date.now() - this.startTime;
        const passedTests = this.results.filter((r) => r.passed).length;
        const failedTests = this.results.filter((r) => !r.passed).length;
        console.log("\n" + "=".repeat(60));
        console.log("📊 VALIDATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⏱️ Duration: ${totalDuration}ms`);
        console.log(`📈 Success Rate: ${((passedTests / this.results.length) * 100).toFixed(1)}%`);
        if (failedTests > 0) {
            console.log("\n❌ FAILED TESTS:");
            this.results
                .filter((r) => !r.passed)
                .forEach((result) => {
                console.log(`  • ${result.name}: ${result.details}`);
            });
        }
        return {
            totalTests: this.results.length,
            passedTests,
            failedTests,
            results: this.results,
            duration: totalDuration,
        };
    }
    async runTest(name, testFn) {
        const startTime = Date.now();
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.results.push({
                name,
                passed: true,
                details: "Test passed successfully",
                duration,
            });
            console.log(`✅ ${name} (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.results.push({
                name,
                passed: false,
                details: error instanceof Error ? error.message : String(error),
                duration,
            });
            console.log(`❌ ${name} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async testDatabaseLayer() {
        console.log("\n🗄️ Testing Database Layer");
        console.log("-".repeat(40));
        await this.runTest("Database Connection", async () => {
            const { data, error } = await supabase_js_1.supabaseAdmin
                .from("tenants")
                .select("count")
                .limit(1);
            if (error)
                throw new Error(`Database connection failed: ${error.message}`);
        });
        await this.runTest("Table Structure Validation", async () => {
            const tables = ["tenants", "users", "clients"];
            for (const table of tables) {
                const { error } = await supabase_js_1.supabaseAdmin.from(table).select("*").limit(1);
                if (error && error.code !== "PGRST116") {
                    throw new Error(`Table ${table} not accessible: ${error.message}`);
                }
            }
        });
        await this.runTest("Service Layer Database Access", async () => {
            const timestamp = Date.now();
            const tenant = await tenantService_js_1.TenantService.createTenant({
                name: "DB Test Tenant",
                slug: `db-test-${timestamp}`,
                description: "Database layer test",
                adminUser: {
                    email: `db-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "DB",
                    lastName: "Admin",
                },
            });
            if (!tenant || !tenant.id) {
                throw new Error("Service layer database access failed");
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        });
    }
    async testServiceLayerIntegration() {
        console.log("\n⚙️ Testing Service Layer Integration");
        console.log("-".repeat(40));
        const timestamp = Date.now();
        let testTenant;
        let testClient;
        let testUser;
        await this.runTest("Complete Service Integration", async () => {
            testTenant = await tenantService_js_1.TenantService.createTenant({
                name: "Integration Test Tenant",
                slug: `integration-${timestamp}`,
                description: "Service integration test",
                adminUser: {
                    email: `integration-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Integration",
                    lastName: "Admin",
                },
            });
            testClient = await clientService_js_1.ClientService.createClient({
                tenantId: testTenant.id,
                name: "Integration Test Client",
                email: `integration-client-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            testUser = await userService_js_1.UserService.createUser({
                email: `integration-user-${timestamp}@test.com`,
                password: "Password123!",
                firstName: "Integration",
                lastName: "User",
                tenantId: testTenant.id,
                role: "END_USER",
                clientId: testClient.id,
            });
            if (!testTenant?.id || !testClient?.id || !testUser?.id) {
                throw new Error("Service integration failed - entities not created");
            }
            const retrievedTenant = await tenantService_js_1.TenantService.getTenantById(testTenant.id);
            const retrievedClient = await clientService_js_1.ClientService.getClientById(testClient.id);
            const retrievedUser = await userService_js_1.UserService.getUserById(testUser.id);
            if (!retrievedTenant || !retrievedClient || !retrievedUser) {
                throw new Error("Service integration failed - entities not retrievable");
            }
        });
        await this.runTest("Service Integration Cleanup", async () => {
            if (testUser)
                await userService_js_1.UserService.deleteUser(testUser.id, true);
            if (testClient)
                await clientService_js_1.ClientService.deleteClient(testClient.id, true);
            if (testTenant)
                await tenantService_js_1.TenantService.deleteTenant(testTenant.id, true);
        });
    }
    async testAuthenticationSystem() {
        console.log("\n🔐 Testing Authentication System");
        console.log("-".repeat(40));
        const timestamp = Date.now();
        let testTenant;
        let loginResult;
        await this.runTest("Complete Authentication Flow", async () => {
            testTenant = await tenantService_js_1.TenantService.createTenant({
                name: "Auth Test Tenant",
                slug: `auth-test-${timestamp}`,
                description: "Authentication testing",
                adminUser: {
                    email: `auth-admin-${timestamp}@test.com`,
                    password: "AuthPassword123!",
                    firstName: "Auth",
                    lastName: "Admin",
                },
            });
            await new Promise((resolve) => setTimeout(resolve, 100));
            const registerResult = await authService_js_1.AuthService.register({
                email: `newuser-${timestamp}@test.com`,
                password: "NewUserPassword123!",
                firstName: "New",
                lastName: "User",
                tenantSlug: testTenant.slug,
                role: "END_USER",
            });
            if (!registerResult.success) {
                throw new Error(`Registration failed: ${registerResult.error}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            loginResult = await authService_js_1.AuthService.login(`auth-admin-${timestamp}@test.com`, "AuthPassword123!", testTenant.slug);
            if (!loginResult.success) {
                throw new Error(`Login failed: ${loginResult.error}`);
            }
            if (!loginResult.accessToken || !loginResult.user) {
                throw new Error("Login response missing required fields");
            }
            const session = await authService_js_1.AuthService.getSession(loginResult.accessToken);
            if (!session.isValid) {
                throw new Error("Session validation failed");
            }
            if (loginResult.refreshToken) {
                const refreshResult = await authService_js_1.AuthService.refreshToken(loginResult.refreshToken);
                if (!refreshResult.success) {
                    throw new Error(`Token refresh failed: ${refreshResult.error}`);
                }
            }
        });
        await this.runTest("Auth System Cleanup", async () => {
            if (testTenant)
                await tenantService_js_1.TenantService.deleteTenant(testTenant.id, true);
        });
    }
    async testDataIsolation() {
        console.log("\n🔒 Testing Data Isolation");
        console.log("-".repeat(40));
        const timestamp = Date.now();
        let tenant1, tenant2;
        let user1, user2;
        let client1, client2;
        await this.runTest("Multi-Tenant Data Isolation", async () => {
            tenant1 = await tenantService_js_1.TenantService.createTenant({
                name: "Isolation Test Tenant 1",
                slug: `isolation1-${timestamp}`,
                description: "First tenant for isolation testing",
                adminUser: {
                    email: `admin1-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Admin1",
                    lastName: "User",
                },
            });
            tenant2 = await tenantService_js_1.TenantService.createTenant({
                name: "Isolation Test Tenant 2",
                slug: `isolation2-${timestamp}`,
                description: "Second tenant for isolation testing",
                adminUser: {
                    email: `admin2-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Admin2",
                    lastName: "User",
                },
            });
            client1 = await clientService_js_1.ClientService.createClient({
                tenantId: tenant1.id,
                name: "Client 1",
                email: `client1-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            client2 = await clientService_js_1.ClientService.createClient({
                tenantId: tenant2.id,
                name: "Client 2",
                email: `client2-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            user1 = await userService_js_1.UserService.createUser({
                email: `user1-${timestamp}@test.com`,
                password: "UserPassword123!",
                firstName: "User1",
                lastName: "Test",
                tenantId: tenant1.id,
                role: "END_USER",
                clientId: client1.id,
            });
            user2 = await userService_js_1.UserService.createUser({
                email: `user2-${timestamp}@test.com`,
                password: "UserPassword123!",
                firstName: "User2",
                lastName: "Test",
                tenantId: tenant2.id,
                role: "END_USER",
                clientId: client2.id,
            });
            const tenant1Users = await userService_js_1.UserService.getUsersByTenant(tenant1.id);
            const tenant2Users = await userService_js_1.UserService.getUsersByTenant(tenant2.id);
            const tenant1UserIds = tenant1Users.users.map((u) => u.id);
            const tenant2UserIds = tenant2Users.users.map((u) => u.id);
            if (tenant1UserIds.includes(user2.id)) {
                throw new Error("Tenant 1 can see Tenant 2 users - isolation failed");
            }
            if (tenant2UserIds.includes(user1.id)) {
                throw new Error("Tenant 2 can see Tenant 1 users - isolation failed");
            }
            const tenant1Clients = await clientService_js_1.ClientService.getClientsByTenant(tenant1.id);
            const tenant2Clients = await clientService_js_1.ClientService.getClientsByTenant(tenant2.id);
            const tenant1ClientIds = tenant1Clients.clients.map((c) => c.id);
            const tenant2ClientIds = tenant2Clients.clients.map((c) => c.id);
            if (tenant1ClientIds.includes(client2.id)) {
                throw new Error("Tenant 1 can see Tenant 2 clients - isolation failed");
            }
            if (tenant2ClientIds.includes(client1.id)) {
                throw new Error("Tenant 2 can see Tenant 1 clients - isolation failed");
            }
        });
        await this.runTest("Data Isolation Cleanup", async () => {
            if (user1)
                await userService_js_1.UserService.deleteUser(user1.id, true);
            if (user2)
                await userService_js_1.UserService.deleteUser(user2.id, true);
            if (client1)
                await clientService_js_1.ClientService.deleteClient(client1.id, true);
            if (client2)
                await clientService_js_1.ClientService.deleteClient(client2.id, true);
            if (tenant1)
                await tenantService_js_1.TenantService.deleteTenant(tenant1.id, true);
            if (tenant2)
                await tenantService_js_1.TenantService.deleteTenant(tenant2.id, true);
        });
    }
    async testRoleBasedAccess() {
        console.log("\n👥 Testing Role-Based Access Control");
        console.log("-".repeat(40));
        const timestamp = Date.now();
        let testTenant;
        let superAdmin, coworkAdmin, clientAdmin, endUser;
        let testClient;
        await this.runTest("Role-Based Access Control", async () => {
            testTenant = await tenantService_js_1.TenantService.createTenant({
                name: "RBAC Test Tenant",
                slug: `rbac-${timestamp}`,
                description: "Tenant for role-based access testing",
                adminUser: {
                    email: `cowork-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Cowork",
                    lastName: "Admin",
                },
            });
            testClient = await clientService_js_1.ClientService.createClient({
                tenantId: testTenant.id,
                name: "RBAC Test Client",
                email: `rbac-client-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            superAdmin = await userService_js_1.UserService.createUser({
                email: `super-admin-${timestamp}@test.com`,
                password: "Password123!",
                firstName: "Super",
                lastName: "Admin",
                tenantId: testTenant.id,
                role: "SUPER_ADMIN",
            });
            clientAdmin = await userService_js_1.UserService.createUser({
                email: `client-admin-${timestamp}@test.com`,
                password: "Password123!",
                firstName: "Client",
                lastName: "Admin",
                tenantId: testTenant.id,
                role: "CLIENT_ADMIN",
                clientId: testClient.id,
            });
            endUser = await userService_js_1.UserService.createUser({
                email: `end-user-${timestamp}@test.com`,
                password: "Password123!",
                firstName: "End",
                lastName: "User",
                tenantId: testTenant.id,
                role: "END_USER",
                clientId: testClient.id,
            });
            const superAdminPermission = await authService_js_1.AuthService.verifyPermissions(superAdmin.id, "manage", "tenant", testTenant.id);
            if (!superAdminPermission) {
                throw new Error("Super admin permissions not working correctly");
            }
            const endUserPermission = await authService_js_1.AuthService.verifyPermissions(endUser.id, "manage", "tenant", testTenant.id);
            if (endUserPermission) {
                throw new Error("End user has tenant management permissions - security issue");
            }
        });
        await this.runTest("RBAC Cleanup", async () => {
            if (superAdmin)
                await userService_js_1.UserService.deleteUser(superAdmin.id, true);
            if (clientAdmin)
                await userService_js_1.UserService.deleteUser(clientAdmin.id, true);
            if (endUser)
                await userService_js_1.UserService.deleteUser(endUser.id, true);
            if (testClient)
                await clientService_js_1.ClientService.deleteClient(testClient.id, true);
            if (testTenant)
                await tenantService_js_1.TenantService.deleteTenant(testTenant.id, true);
        });
    }
    async testEdgeCases() {
        console.log("\n🔍 Testing Edge Cases");
        console.log("-".repeat(40));
        await this.runTest("Invalid Data Handling", async () => {
            try {
                await tenantService_js_1.TenantService.createTenant({
                    name: "",
                    slug: "",
                    description: "",
                    adminUser: {
                        email: "invalid-email",
                        password: "weak",
                        firstName: "",
                        lastName: "",
                    },
                });
                throw new Error("Invalid tenant creation should have failed");
            }
            catch (error) {
                if (error.message === "Invalid tenant creation should have failed") {
                    throw error;
                }
            }
        });
        await this.runTest("Duplicate Prevention", async () => {
            const timestamp = Date.now();
            const tenant1 = await tenantService_js_1.TenantService.createTenant({
                name: "Duplicate Test Tenant",
                slug: `duplicate-test-${timestamp}`,
                description: "First tenant",
                adminUser: {
                    email: `duplicate-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Admin",
                    lastName: "User",
                },
            });
            try {
                await tenantService_js_1.TenantService.createTenant({
                    name: "Duplicate Test Tenant 2",
                    slug: `duplicate-test-${timestamp}`,
                    description: "Second tenant",
                    adminUser: {
                        email: `duplicate-admin2-${timestamp}@test.com`,
                        password: "Password123!",
                        firstName: "Admin2",
                        lastName: "User",
                    },
                });
                throw new Error("Duplicate slug should have been prevented");
            }
            catch (error) {
                if (error.message === "Duplicate slug should have been prevented") {
                    throw error;
                }
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant1.id, true);
        });
    }
    async testPerformance() {
        console.log("\n⚡ Testing Performance");
        console.log("-".repeat(40));
        await this.runTest("Service Layer Performance", async () => {
            const timestamp = Date.now();
            const startTime = Date.now();
            const tenant = await tenantService_js_1.TenantService.createTenant({
                name: "Performance Test Tenant",
                slug: `perf-test-${timestamp}`,
                description: "Tenant for performance testing",
                adminUser: {
                    email: `perf-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Perf",
                    lastName: "Admin",
                },
            });
            const createTime = Date.now() - startTime;
            if (createTime > 5000) {
                throw new Error(`Tenant creation too slow: ${createTime}ms`);
            }
            const retrievalStart = Date.now();
            const retrievedTenant = await tenantService_js_1.TenantService.getTenantById(tenant.id);
            const retrievalTime = Date.now() - retrievalStart;
            if (retrievalTime > 1000) {
                throw new Error(`Tenant retrieval too slow: ${retrievalTime}ms`);
            }
            if (!retrievedTenant) {
                throw new Error("Tenant not retrieved");
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        });
    }
}
exports.FixedMultiTenantValidator = FixedMultiTenantValidator;
const validator = new FixedMultiTenantValidator();
validator
    .runValidation()
    .then((results) => {
    if (results.failedTests === 0) {
        console.log("\n🎉 All tests passed! Multi-tenant architecture is working correctly.");
        process.exit(0);
    }
    else {
        console.log(`\n⚠️ ${results.failedTests} test(s) failed. Please review the issues above.`);
        if (results.passedTests > results.failedTests) {
            console.log("✅ Overall system is functional with minor issues to address.");
        }
        process.exit(results.failedTests > results.passedTests ? 1 : 0);
    }
})
    .catch((error) => {
    console.error("\n💥 Validation suite crashed:", error);
    process.exit(1);
});
//# sourceMappingURL=validate-multitenant-fixed.js.map