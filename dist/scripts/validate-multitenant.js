"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTenantValidator = void 0;
const authService_js_1 = require("../services/authService.js");
const tenantService_js_1 = require("../services/tenantService.js");
const userService_js_1 = require("../services/userService.js");
const clientService_js_1 = require("../services/clientService.js");
const supabase_js_1 = require("../lib/supabase.js");
const rls_js_1 = require("../lib/rls.js");
class MultiTenantValidator {
    results = [];
    startTime = 0;
    async runValidation() {
        console.log("🔍 Starting Multi-Tenant Architecture Validation");
        console.log("=".repeat(60));
        this.startTime = Date.now();
        await this.testDatabaseLayer();
        await this.testServiceLayer();
        await this.testAuthenticationSystem();
        await this.testDataIsolation();
        await this.testRoleBasedAccess();
        await this.testAPIEndpoints();
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
        await this.runTest("Foreign Key Constraints", async () => {
            const timestamp = Date.now();
            const { data: tenant, error: tenantError } = await supabase_js_1.supabaseAdmin
                .from("tenants")
                .insert({
                id: `test_tenant_${timestamp}`,
                name: "Test Tenant",
                slug: `test-${timestamp}`,
                status: "ACTIVE",
            })
                .select()
                .single();
            if (tenantError)
                throw new Error(`Failed to create test tenant: ${tenantError.message}`);
            try {
                await supabase_js_1.supabaseAdmin.from("users").insert({
                    id: `test_user_${timestamp}`,
                    tenantId: "invalid_tenant_id",
                    supabaseId: `test_supabase_${timestamp}`,
                    email: `test@${timestamp}.com`,
                    firstName: "Test",
                    lastName: "User",
                    role: "END_USER",
                    status: "ACTIVE",
                });
                throw new Error("Foreign key constraint not working - invalid tenant ID accepted");
            }
            catch (error) {
                if (!error.message.includes("violates foreign key constraint")) {
                    throw new Error("Foreign key constraint not properly configured");
                }
            }
            await supabase_js_1.supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
        });
    }
    async testServiceLayer() {
        console.log("\n⚙️ Testing Service Layer");
        console.log("-".repeat(40));
        const timestamp = Date.now();
        let testTenant;
        let testClient;
        let testUser;
        await this.runTest("TenantService CRUD Operations", async () => {
            testTenant = await tenantService_js_1.TenantService.createTenant({
                name: "Test Tenant Service",
                slug: `test-service-${timestamp}`,
                description: "Test tenant for service validation",
                adminUser: {
                    email: `admin-${timestamp}@test.com`,
                    password: "TestPassword123!",
                    firstName: "Admin",
                    lastName: "User",
                },
            });
            if (!testTenant || !testTenant.id) {
                throw new Error("Failed to create tenant");
            }
            const retrievedTenant = await tenantService_js_1.TenantService.getTenantById(testTenant.id);
            if (!retrievedTenant || retrievedTenant.id !== testTenant.id) {
                throw new Error("Failed to retrieve tenant");
            }
            const updatedTenant = await tenantService_js_1.TenantService.updateTenant(testTenant.id, {
                description: "Updated description",
            });
            if (updatedTenant.description !== "Updated description") {
                throw new Error("Failed to update tenant");
            }
        });
        await this.runTest("ClientService CRUD Operations", async () => {
            if (!testTenant)
                throw new Error("Test tenant not available");
            testClient = await clientService_js_1.ClientService.createClient({
                tenantId: testTenant.id,
                name: "Test Client Service",
                email: `client-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            if (!testClient || !testClient.id) {
                throw new Error("Failed to create client");
            }
            const retrievedClient = await clientService_js_1.ClientService.getClientById(testClient.id);
            if (!retrievedClient || retrievedClient.id !== testClient.id) {
                throw new Error("Failed to retrieve client");
            }
            const updatedClient = await clientService_js_1.ClientService.updateClient(testClient.id, {
                name: "Updated Client Name",
            });
            if (updatedClient.name !== "Updated Client Name") {
                throw new Error("Failed to update client");
            }
        });
        await this.runTest("UserService CRUD Operations", async () => {
            if (!testTenant)
                throw new Error("Test tenant not available");
            testUser = await userService_js_1.UserService.createUser({
                email: `user-${timestamp}@test.com`,
                password: "UserPassword123!",
                firstName: "Test",
                lastName: "User",
                tenantId: testTenant.id,
                role: "END_USER",
            });
            if (!testUser || !testUser.id) {
                throw new Error("Failed to create user");
            }
            const retrievedUser = await userService_js_1.UserService.getUserById(testUser.id);
            if (!retrievedUser || retrievedUser.id !== testUser.id) {
                throw new Error("Failed to retrieve user");
            }
            const updatedUser = await userService_js_1.UserService.updateUser(testUser.id, {
                firstName: "Updated",
            });
            if (updatedUser.firstName !== "Updated") {
                throw new Error("Failed to update user");
            }
        });
        await this.runTest("Service Layer Cleanup", async () => {
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
        await this.runTest("User Registration Flow", async () => {
            testTenant = await tenantService_js_1.TenantService.createTenant({
                name: "Auth Test Tenant",
                slug: `auth-test-${timestamp}`,
                description: "Tenant for auth testing",
                adminUser: {
                    email: `auth-admin-${timestamp}@test.com`,
                    password: "AuthPassword123!",
                    firstName: "Auth",
                    lastName: "Admin",
                },
            });
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
        });
        await this.runTest("User Login Flow", async () => {
            if (!testTenant)
                throw new Error("Test tenant not available");
            loginResult = await authService_js_1.AuthService.login(`auth-admin-${timestamp}@test.com`, "AuthPassword123!", testTenant.slug);
            if (!loginResult.success) {
                throw new Error(`Login failed: ${loginResult.error}`);
            }
            if (!loginResult.accessToken || !loginResult.user) {
                throw new Error("Login response missing required fields");
            }
        });
        await this.runTest("Session Validation", async () => {
            if (!loginResult?.accessToken)
                throw new Error("No access token available");
            const session = await authService_js_1.AuthService.getSession(loginResult.accessToken);
            if (!session.isValid) {
                throw new Error("Session validation failed");
            }
            if (session.user.email !== `auth-admin-${timestamp}@test.com`) {
                throw new Error("Session user mismatch");
            }
        });
        await this.runTest("Token Refresh", async () => {
            if (!loginResult?.refreshToken)
                throw new Error("No refresh token available");
            const refreshResult = await authService_js_1.AuthService.refreshToken(loginResult.refreshToken);
            if (!refreshResult.success) {
                throw new Error(`Token refresh failed: ${refreshResult.error}`);
            }
            if (!refreshResult.accessToken) {
                throw new Error("Refresh response missing access token");
            }
        });
        await this.runTest("Password Change", async () => {
            if (!loginResult?.user?.id)
                throw new Error("No user ID available");
            const changeResult = await authService_js_1.AuthService.changePassword(loginResult.user.id, "AuthPassword123!", "NewAuthPassword123!");
            if (!changeResult.success) {
                throw new Error(`Password change failed: ${changeResult.error}`);
            }
        });
        await this.runTest("Logout", async () => {
            if (!loginResult?.accessToken)
                throw new Error("No access token available");
            await authService_js_1.AuthService.logout(loginResult.accessToken);
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
        await this.runTest("Multi-Tenant Data Creation", async () => {
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
        });
        await this.runTest("Cross-Tenant Data Access Prevention", async () => {
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
        await this.runTest("RLS Policy Validation", async () => {
            const login1 = await authService_js_1.AuthService.login(`admin1-${timestamp}@test.com`, "Password123!", tenant1.slug);
            if (!login1.success) {
                throw new Error("Failed to login as tenant1 admin");
            }
            const rlsTest = await (0, rls_js_1.testRLSPolicies)(login1.accessToken);
            if (rlsTest.context.tenantId !== tenant1.id) {
                throw new Error("RLS context tenant mismatch");
            }
            if (rlsTest.tests.users.error) {
                throw new Error(`RLS user access failed: ${rlsTest.tests.users.error.message}`);
            }
            const userTenantIds = rlsTest.tests.users.data?.map((u) => u.tenantId) || [];
            const invalidTenantUsers = userTenantIds.filter((id) => id !== tenant1.id);
            if (invalidTenantUsers.length > 0) {
                throw new Error("RLS allowing access to other tenant's users");
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
        await this.runTest("Role Hierarchy Setup", async () => {
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
            const coworkAdminUser = await userService_js_1.UserService.getUserByEmail(`cowork-admin-${timestamp}@test.com`, testTenant.id);
            coworkAdmin = coworkAdminUser;
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
        });
        await this.runTest("Super Admin Permissions", async () => {
            if (!superAdmin)
                throw new Error("Super admin not created");
            const hasPermission = await authService_js_1.AuthService.verifyPermissions(superAdmin.id, "manage", "tenant", testTenant.id);
            if (!hasPermission) {
                throw new Error("Super admin cannot manage tenant");
            }
        });
        await this.runTest("Cowork Admin Permissions", async () => {
            if (!coworkAdmin)
                throw new Error("Cowork admin not available");
            const canManageUsers = await authService_js_1.AuthService.verifyPermissions(coworkAdmin.id, "manage", "user", endUser.id);
            if (!canManageUsers) {
                throw new Error("Cowork admin cannot manage users");
            }
            const canManageClients = await authService_js_1.AuthService.verifyPermissions(coworkAdmin.id, "manage", "client", testClient.id);
            if (!canManageClients) {
                throw new Error("Cowork admin cannot manage clients");
            }
        });
        await this.runTest("Client Admin Permissions", async () => {
            if (!clientAdmin)
                throw new Error("Client admin not created");
            const canAccessOwnClient = await authService_js_1.AuthService.verifyPermissions(clientAdmin.id, "read", "client", testClient.id);
            if (!canAccessOwnClient) {
                throw new Error("Client admin cannot access own client");
            }
            const canAccessOtherClient = await authService_js_1.AuthService.verifyPermissions(clientAdmin.id, "read", "client", "other-client-id");
            if (canAccessOtherClient) {
                throw new Error("Client admin can access other clients - permission leak");
            }
        });
        await this.runTest("End User Permissions", async () => {
            if (!endUser)
                throw new Error("End user not created");
            const canAccessOwnData = await authService_js_1.AuthService.verifyPermissions(endUser.id, "read", "user", endUser.id);
            if (!canAccessOwnData) {
                throw new Error("End user cannot access own data");
            }
            const canAccessOtherUser = await authService_js_1.AuthService.verifyPermissions(endUser.id, "read", "user", clientAdmin.id);
            if (canAccessOtherUser) {
                throw new Error("End user can access other user data - permission leak");
            }
            const canManageTenant = await authService_js_1.AuthService.verifyPermissions(endUser.id, "manage", "tenant", testTenant.id);
            if (canManageTenant) {
                throw new Error("End user can manage tenant - permission leak");
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
    async testAPIEndpoints() {
        console.log("\n🌐 Testing API Endpoints");
        console.log("-".repeat(40));
        await this.runTest("API Service Layer Integration", async () => {
            const timestamp = Date.now();
            const tenant = await tenantService_js_1.TenantService.createTenant({
                name: "API Test Tenant",
                slug: `api-test-${timestamp}`,
                description: "Tenant for API testing",
                adminUser: {
                    email: `api-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "API",
                    lastName: "Admin",
                },
            });
            const loginResult = await authService_js_1.AuthService.login(`api-admin-${timestamp}@test.com`, "Password123!", tenant.slug);
            if (!loginResult.success) {
                throw new Error("API authentication simulation failed");
            }
            const session = await authService_js_1.AuthService.getSession(loginResult.accessToken);
            if (!session.isValid) {
                throw new Error("API session validation simulation failed");
            }
            const user = await userService_js_1.UserService.createUser({
                email: `api-user-${timestamp}@test.com`,
                password: "Password123!",
                firstName: "API",
                lastName: "User",
                tenantId: tenant.id,
                role: "END_USER",
            });
            const client = await clientService_js_1.ClientService.createClient({
                tenantId: tenant.id,
                name: "API Test Client",
                email: `api-client-${timestamp}@test.com`,
                status: "ACTIVE",
            });
            await userService_js_1.UserService.deleteUser(user.id, true);
            await clientService_js_1.ClientService.deleteClient(client.id, true);
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
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
        await this.runTest("Duplicate Data Prevention", async () => {
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
        await this.runTest("Large Data Set Handling", async () => {
            const timestamp = Date.now();
            const tenant = await tenantService_js_1.TenantService.createTenant({
                name: "Large Data Test Tenant",
                slug: `large-data-${timestamp}`,
                description: "Tenant for large data testing",
                adminUser: {
                    email: `large-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Large",
                    lastName: "Admin",
                },
            });
            const clients = [];
            const users = [];
            for (let i = 0; i < 5; i++) {
                const client = await clientService_js_1.ClientService.createClient({
                    tenantId: tenant.id,
                    name: `Large Test Client ${i}`,
                    email: `large-client-${i}-${timestamp}@test.com`,
                    status: "ACTIVE",
                });
                clients.push(client);
                const user = await userService_js_1.UserService.createUser({
                    email: `large-user-${i}-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: `User${i}`,
                    lastName: "Test",
                    tenantId: tenant.id,
                    role: "END_USER",
                    clientId: client.id,
                });
                users.push(user);
            }
            const paginatedUsers = await userService_js_1.UserService.getUsersByTenant(tenant.id, 1, 3);
            if (paginatedUsers.users.length !== 3) {
                throw new Error("Pagination not working correctly");
            }
            for (const user of users) {
                await userService_js_1.UserService.deleteUser(user.id, true);
            }
            for (const client of clients) {
                await clientService_js_1.ClientService.deleteClient(client.id, true);
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        });
    }
    async testPerformance() {
        console.log("\n⚡ Testing Performance");
        console.log("-".repeat(40));
        await this.runTest("Query Performance", async () => {
            const timestamp = Date.now();
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
            const startTime = Date.now();
            const retrievedTenant = await tenantService_js_1.TenantService.getTenantById(tenant.id);
            const queryTime = Date.now() - startTime;
            if (queryTime > 1000) {
                throw new Error(`Tenant query too slow: ${queryTime}ms`);
            }
            if (!retrievedTenant) {
                throw new Error("Tenant not retrieved");
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        });
        await this.runTest("Concurrent Operations", async () => {
            const timestamp = Date.now();
            const tenant = await tenantService_js_1.TenantService.createTenant({
                name: "Concurrent Test Tenant",
                slug: `concurrent-${timestamp}`,
                description: "Tenant for concurrent testing",
                adminUser: {
                    email: `concurrent-admin-${timestamp}@test.com`,
                    password: "Password123!",
                    firstName: "Concurrent",
                    lastName: "Admin",
                },
            });
            const clientPromises = [];
            for (let i = 0; i < 3; i++) {
                clientPromises.push(clientService_js_1.ClientService.createClient({
                    tenantId: tenant.id,
                    name: `Concurrent Client ${i}`,
                    email: `concurrent-client-${i}-${timestamp}@test.com`,
                    status: "ACTIVE",
                }));
            }
            const clients = await Promise.all(clientPromises);
            if (clients.length !== 3) {
                throw new Error("Concurrent operations failed");
            }
            for (const client of clients) {
                await clientService_js_1.ClientService.deleteClient(client.id, true);
            }
            await tenantService_js_1.TenantService.deleteTenant(tenant.id, true);
        });
    }
}
exports.MultiTenantValidator = MultiTenantValidator;
const validator = new MultiTenantValidator();
validator
    .runValidation()
    .then((results) => {
    if (results.failedTests === 0) {
        console.log("\n🎉 All tests passed! Multi-tenant architecture is working correctly.");
        process.exit(0);
    }
    else {
        console.log(`\n❌ ${results.failedTests} test(s) failed. Please review and fix the issues.`);
        process.exit(1);
    }
})
    .catch((error) => {
    console.error("\n💥 Validation suite crashed:", error);
    process.exit(1);
});
//# sourceMappingURL=validate-multitenant.js.map