import { AuthService } from "../services/authService.js";
import { TenantService } from "../services/tenantService.js";
import { UserService } from "../services/userService.js";
import { ClientService } from "../services/clientService.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { getTenantContext, testRLSPolicies } from "../lib/rls.js";

/**
 * Comprehensive Multi-Tenant Validation Suite
 * Tests all aspects of the multi-tenant architecture
 */

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

interface ValidationResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  duration: number;
}

class MultiTenantValidator {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runValidation(): Promise<ValidationResults> {
    console.log("🔍 Starting Multi-Tenant Architecture Validation");
    console.log("=".repeat(60));

    this.startTime = Date.now();

    // Run all test categories
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
    console.log(
      `📈 Success Rate: ${((passedTests / this.results.length) * 100).toFixed(
        1
      )}%`
    );

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

  private async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<void> {
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
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: false,
        details: error instanceof Error ? error.message : String(error),
        duration,
      });
      console.log(
        `❌ ${name} (${duration}ms): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async testDatabaseLayer(): Promise<void> {
    console.log("\n🗄️ Testing Database Layer");
    console.log("-".repeat(40));

    await this.runTest("Database Connection", async () => {
      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("count")
        .limit(1);
      if (error)
        throw new Error(`Database connection failed: ${error.message}`);
    });

    await this.runTest("Table Structure Validation", async () => {
      // Check if all required tables exist
      const tables = ["tenants", "users", "clients"];
      for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).select("*").limit(1);
        if (error && error.code !== "PGRST116") {
          throw new Error(`Table ${table} not accessible: ${error.message}`);
        }
      }
    });

    await this.runTest("Foreign Key Constraints", async () => {
      // Test foreign key relationships
      const timestamp = Date.now();

      // Create test tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
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

      // Try to create user with invalid tenant ID (should fail)
      try {
        await supabaseAdmin.from("users").insert({
          id: `test_user_${timestamp}`,
          tenantId: "invalid_tenant_id",
          supabaseId: `test_supabase_${timestamp}`,
          email: `test@${timestamp}.com`,
          firstName: "Test",
          lastName: "User",
          role: "END_USER",
          status: "ACTIVE",
        });
        throw new Error(
          "Foreign key constraint not working - invalid tenant ID accepted"
        );
      } catch (error: any) {
        if (!error.message.includes("violates foreign key constraint")) {
          throw new Error("Foreign key constraint not properly configured");
        }
      }

      // Cleanup
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    });
  }

  private async testServiceLayer(): Promise<void> {
    console.log("\n⚙️ Testing Service Layer");
    console.log("-".repeat(40));

    const timestamp = Date.now();
    let testTenant: any;
    let testClient: any;
    let testUser: any;

    await this.runTest("TenantService CRUD Operations", async () => {
      // Create tenant
      testTenant = await TenantService.createTenant({
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

      // Read tenant
      const retrievedTenant = await TenantService.getTenantById(testTenant.id);
      if (!retrievedTenant || retrievedTenant.id !== testTenant.id) {
        throw new Error("Failed to retrieve tenant");
      }

      // Update tenant
      const updatedTenant = await TenantService.updateTenant(testTenant.id, {
        description: "Updated description",
      });
      if (updatedTenant.description !== "Updated description") {
        throw new Error("Failed to update tenant");
      }
    });

    await this.runTest("ClientService CRUD Operations", async () => {
      if (!testTenant) throw new Error("Test tenant not available");

      // Create client
      testClient = await ClientService.createClient({
        tenantId: testTenant.id,
        name: "Test Client Service",
        email: `client-${timestamp}@test.com`,
        status: "ACTIVE",
      });

      if (!testClient || !testClient.id) {
        throw new Error("Failed to create client");
      }

      // Read client
      const retrievedClient = await ClientService.getClientById(testClient.id);
      if (!retrievedClient || retrievedClient.id !== testClient.id) {
        throw new Error("Failed to retrieve client");
      }

      // Update client
      const updatedClient = await ClientService.updateClient(testClient.id, {
        name: "Updated Client Name",
      });
      if (updatedClient.name !== "Updated Client Name") {
        throw new Error("Failed to update client");
      }
    });

    await this.runTest("UserService CRUD Operations", async () => {
      if (!testTenant) throw new Error("Test tenant not available");

      // Create user
      testUser = await UserService.createUser({
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

      // Read user
      const retrievedUser = await UserService.getUserById(testUser.id);
      if (!retrievedUser || retrievedUser.id !== testUser.id) {
        throw new Error("Failed to retrieve user");
      }

      // Update user
      const updatedUser = await UserService.updateUser(testUser.id, {
        firstName: "Updated",
      });
      if (updatedUser.firstName !== "Updated") {
        throw new Error("Failed to update user");
      }
    });

    // Cleanup service layer test data
    await this.runTest("Service Layer Cleanup", async () => {
      if (testUser) await UserService.deleteUser(testUser.id, true);
      if (testClient) await ClientService.deleteClient(testClient.id, true);
      if (testTenant) await TenantService.deleteTenant(testTenant.id, true);
    });
  }

  private async testAuthenticationSystem(): Promise<void> {
    console.log("\n🔐 Testing Authentication System");
    console.log("-".repeat(40));

    const timestamp = Date.now();
    let testTenant: any;
    let loginResult: any;

    await this.runTest("User Registration Flow", async () => {
      // Create tenant first
      testTenant = await TenantService.createTenant({
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

      // Test user registration
      const registerResult = await AuthService.register({
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
      if (!testTenant) throw new Error("Test tenant not available");

      loginResult = await AuthService.login(
        `auth-admin-${timestamp}@test.com`,
        "AuthPassword123!",
        testTenant.slug
      );

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

      const session = await AuthService.getSession(loginResult.accessToken);
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

      const refreshResult = await AuthService.refreshToken(
        loginResult.refreshToken
      );
      if (!refreshResult.success) {
        throw new Error(`Token refresh failed: ${refreshResult.error}`);
      }

      if (!refreshResult.accessToken) {
        throw new Error("Refresh response missing access token");
      }
    });

    await this.runTest("Password Change", async () => {
      if (!loginResult?.user?.id) throw new Error("No user ID available");

      const changeResult = await AuthService.changePassword(
        loginResult.user.id,
        "AuthPassword123!",
        "NewAuthPassword123!"
      );

      if (!changeResult.success) {
        throw new Error(`Password change failed: ${changeResult.error}`);
      }
    });

    await this.runTest("Logout", async () => {
      if (!loginResult?.accessToken)
        throw new Error("No access token available");

      await AuthService.logout(loginResult.accessToken);
      // Note: Logout success is indicated by no error thrown
    });

    // Cleanup auth test data
    await this.runTest("Auth System Cleanup", async () => {
      if (testTenant) await TenantService.deleteTenant(testTenant.id, true);
    });
  }

  private async testDataIsolation(): Promise<void> {
    console.log("\n🔒 Testing Data Isolation");
    console.log("-".repeat(40));

    const timestamp = Date.now();
    let tenant1: any, tenant2: any;
    let user1: any, user2: any;
    let client1: any, client2: any;

    await this.runTest("Multi-Tenant Data Creation", async () => {
      // Create two separate tenants
      tenant1 = await TenantService.createTenant({
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

      tenant2 = await TenantService.createTenant({
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

      // Create clients in each tenant
      client1 = await ClientService.createClient({
        tenantId: tenant1.id,
        name: "Client 1",
        email: `client1-${timestamp}@test.com`,
        status: "ACTIVE",
      });

      client2 = await ClientService.createClient({
        tenantId: tenant2.id,
        name: "Client 2",
        email: `client2-${timestamp}@test.com`,
        status: "ACTIVE",
      });

      // Create users in each tenant
      user1 = await UserService.createUser({
        email: `user1-${timestamp}@test.com`,
        password: "UserPassword123!",
        firstName: "User1",
        lastName: "Test",
        tenantId: tenant1.id,
        role: "END_USER",
        clientId: client1.id,
      });

      user2 = await UserService.createUser({
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
      // Test that tenant1 users cannot access tenant2 data
      const tenant1Users = await UserService.getUsersByTenant(tenant1.id);
      const tenant2Users = await UserService.getUsersByTenant(tenant2.id);

      // Verify each tenant only sees their own users
      const tenant1UserIds = tenant1Users.users.map((u) => u.id);
      const tenant2UserIds = tenant2Users.users.map((u) => u.id);

      if (tenant1UserIds.includes(user2.id)) {
        throw new Error("Tenant 1 can see Tenant 2 users - isolation failed");
      }

      if (tenant2UserIds.includes(user1.id)) {
        throw new Error("Tenant 2 can see Tenant 1 users - isolation failed");
      }

      // Test client isolation
      const tenant1Clients = await ClientService.getClientsByTenant(tenant1.id);
      const tenant2Clients = await ClientService.getClientsByTenant(tenant2.id);

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
      // Login as user from tenant1
      const login1 = await AuthService.login(
        `admin1-${timestamp}@test.com`,
        "Password123!",
        tenant1.slug
      );

      if (!login1.success) {
        throw new Error("Failed to login as tenant1 admin");
      }

      // Test RLS policies
      const rlsTest = await testRLSPolicies(login1.accessToken!);

      // Verify tenant context
      if (rlsTest.context.tenantId !== tenant1.id) {
        throw new Error("RLS context tenant mismatch");
      }

      // Verify user can only see their tenant's data
      if (rlsTest.tests.users.error) {
        throw new Error(
          `RLS user access failed: ${rlsTest.tests.users.error.message}`
        );
      }

      // Check that returned users belong to correct tenant
      const userTenantIds =
        rlsTest.tests.users.data?.map((u: any) => u.tenantId) || [];
      const invalidTenantUsers = userTenantIds.filter(
        (id) => id !== tenant1.id
      );

      if (invalidTenantUsers.length > 0) {
        throw new Error("RLS allowing access to other tenant's users");
      }
    });

    // Cleanup isolation test data
    await this.runTest("Data Isolation Cleanup", async () => {
      if (user1) await UserService.deleteUser(user1.id, true);
      if (user2) await UserService.deleteUser(user2.id, true);
      if (client1) await ClientService.deleteClient(client1.id, true);
      if (client2) await ClientService.deleteClient(client2.id, true);
      if (tenant1) await TenantService.deleteTenant(tenant1.id, true);
      if (tenant2) await TenantService.deleteTenant(tenant2.id, true);
    });
  }

  private async testRoleBasedAccess(): Promise<void> {
    console.log("\n👥 Testing Role-Based Access Control");
    console.log("-".repeat(40));

    const timestamp = Date.now();
    let testTenant: any;
    let superAdmin: any, coworkAdmin: any, clientAdmin: any, endUser: any;
    let testClient: any;

    await this.runTest("Role Hierarchy Setup", async () => {
      // Create test tenant
      testTenant = await TenantService.createTenant({
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

      // Create test client
      testClient = await ClientService.createClient({
        tenantId: testTenant.id,
        name: "RBAC Test Client",
        email: `rbac-client-${timestamp}@test.com`,
        status: "ACTIVE",
      });

      // Create users with different roles
      superAdmin = await UserService.createUser({
        email: `super-admin-${timestamp}@test.com`,
        password: "Password123!",
        firstName: "Super",
        lastName: "Admin",
        tenantId: testTenant.id,
        role: "SUPER_ADMIN",
      });

      // Cowork admin was created with tenant
      const coworkAdminUser = await UserService.getUserByEmail(
        `cowork-admin-${timestamp}@test.com`,
        testTenant.id
      );
      coworkAdmin = coworkAdminUser;

      clientAdmin = await UserService.createUser({
        email: `client-admin-${timestamp}@test.com`,
        password: "Password123!",
        firstName: "Client",
        lastName: "Admin",
        tenantId: testTenant.id,
        role: "CLIENT_ADMIN",
        clientId: testClient.id,
      });

      endUser = await UserService.createUser({
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
      if (!superAdmin) throw new Error("Super admin not created");

      // Super admin should be able to access any tenant
      const hasPermission = await AuthService.verifyPermissions(
        superAdmin.id,
        "manage",
        "tenant",
        testTenant.id
      );

      if (!hasPermission) {
        throw new Error("Super admin cannot manage tenant");
      }
    });

    await this.runTest("Cowork Admin Permissions", async () => {
      if (!coworkAdmin) throw new Error("Cowork admin not available");

      // Cowork admin should be able to manage users in their tenant
      const canManageUsers = await AuthService.verifyPermissions(
        coworkAdmin.id,
        "manage",
        "user",
        endUser.id
      );

      if (!canManageUsers) {
        throw new Error("Cowork admin cannot manage users");
      }

      // Cowork admin should be able to manage clients in their tenant
      const canManageClients = await AuthService.verifyPermissions(
        coworkAdmin.id,
        "manage",
        "client",
        testClient.id
      );

      if (!canManageClients) {
        throw new Error("Cowork admin cannot manage clients");
      }
    });

    await this.runTest("Client Admin Permissions", async () => {
      if (!clientAdmin) throw new Error("Client admin not created");

      // Client admin should be able to access their own client
      const canAccessOwnClient = await AuthService.verifyPermissions(
        clientAdmin.id,
        "read",
        "client",
        testClient.id
      );

      if (!canAccessOwnClient) {
        throw new Error("Client admin cannot access own client");
      }

      // Client admin should NOT be able to access other clients
      const canAccessOtherClient = await AuthService.verifyPermissions(
        clientAdmin.id,
        "read",
        "client",
        "other-client-id"
      );

      if (canAccessOtherClient) {
        throw new Error(
          "Client admin can access other clients - permission leak"
        );
      }
    });

    await this.runTest("End User Permissions", async () => {
      if (!endUser) throw new Error("End user not created");

      // End user should be able to access their own data
      const canAccessOwnData = await AuthService.verifyPermissions(
        endUser.id,
        "read",
        "user",
        endUser.id
      );

      if (!canAccessOwnData) {
        throw new Error("End user cannot access own data");
      }

      // End user should NOT be able to access other users' data
      const canAccessOtherUser = await AuthService.verifyPermissions(
        endUser.id,
        "read",
        "user",
        clientAdmin.id
      );

      if (canAccessOtherUser) {
        throw new Error(
          "End user can access other user data - permission leak"
        );
      }

      // End user should NOT be able to manage tenants
      const canManageTenant = await AuthService.verifyPermissions(
        endUser.id,
        "manage",
        "tenant",
        testTenant.id
      );

      if (canManageTenant) {
        throw new Error("End user can manage tenant - permission leak");
      }
    });

    // Cleanup RBAC test data
    await this.runTest("RBAC Cleanup", async () => {
      if (superAdmin) await UserService.deleteUser(superAdmin.id, true);
      if (clientAdmin) await UserService.deleteUser(clientAdmin.id, true);
      if (endUser) await UserService.deleteUser(endUser.id, true);
      if (testClient) await ClientService.deleteClient(testClient.id, true);
      if (testTenant) await TenantService.deleteTenant(testTenant.id, true);
    });
  }

  private async testAPIEndpoints(): Promise<void> {
    console.log("\n🌐 Testing API Endpoints");
    console.log("-".repeat(40));

    // Note: This would require starting the server and making HTTP requests
    // For now, we'll test the underlying services that power the APIs

    await this.runTest("API Service Layer Integration", async () => {
      // Test that all services are properly integrated and can be called
      // This simulates what the API endpoints would do

      const timestamp = Date.now();

      // Test tenant creation (POST /api/tenants)
      const tenant = await TenantService.createTenant({
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

      // Test authentication (POST /api/auth/login)
      const loginResult = await AuthService.login(
        `api-admin-${timestamp}@test.com`,
        "Password123!",
        tenant.slug
      );

      if (!loginResult.success) {
        throw new Error("API authentication simulation failed");
      }

      // Test session validation (GET /api/auth/session)
      const session = await AuthService.getSession(loginResult.accessToken!);
      if (!session.isValid) {
        throw new Error("API session validation simulation failed");
      }

      // Test user creation (POST /api/users)
      const user = await UserService.createUser({
        email: `api-user-${timestamp}@test.com`,
        password: "Password123!",
        firstName: "API",
        lastName: "User",
        tenantId: tenant.id,
        role: "END_USER",
      });

      // Test client creation (POST /api/clients)
      const client = await ClientService.createClient({
        tenantId: tenant.id,
        name: "API Test Client",
        email: `api-client-${timestamp}@test.com`,
        status: "ACTIVE",
      });

      // Cleanup
      await UserService.deleteUser(user.id, true);
      await ClientService.deleteClient(client.id, true);
      await TenantService.deleteTenant(tenant.id, true);
    });
  }

  private async testEdgeCases(): Promise<void> {
    console.log("\n🔍 Testing Edge Cases");
    console.log("-".repeat(40));

    await this.runTest("Invalid Data Handling", async () => {
      // Test invalid tenant creation
      try {
        await TenantService.createTenant({
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
      } catch (error: any) {
        if (error.message === "Invalid tenant creation should have failed") {
          throw error;
        }
        // Expected to fail - this is good
      }
    });

    await this.runTest("Duplicate Data Prevention", async () => {
      const timestamp = Date.now();

      // Create first tenant
      const tenant1 = await TenantService.createTenant({
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

      // Try to create second tenant with same slug (should fail)
      try {
        await TenantService.createTenant({
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
      } catch (error: any) {
        if (error.message === "Duplicate slug should have been prevented") {
          throw error;
        }
        // Expected to fail - this is good
      }

      // Cleanup
      await TenantService.deleteTenant(tenant1.id, true);
    });

    await this.runTest("Large Data Set Handling", async () => {
      const timestamp = Date.now();

      // Create tenant
      const tenant = await TenantService.createTenant({
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

      // Create multiple clients and users
      const clients = [];
      const users = [];

      for (let i = 0; i < 5; i++) {
        const client = await ClientService.createClient({
          tenantId: tenant.id,
          name: `Large Test Client ${i}`,
          email: `large-client-${i}-${timestamp}@test.com`,
          status: "ACTIVE",
        });
        clients.push(client);

        const user = await UserService.createUser({
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

      // Test pagination
      const paginatedUsers = await UserService.getUsersByTenant(
        tenant.id,
        1,
        3
      );
      if (paginatedUsers.users.length !== 3) {
        throw new Error("Pagination not working correctly");
      }

      // Cleanup
      for (const user of users) {
        await UserService.deleteUser(user.id, true);
      }
      for (const client of clients) {
        await ClientService.deleteClient(client.id, true);
      }
      await TenantService.deleteTenant(tenant.id, true);
    });
  }

  private async testPerformance(): Promise<void> {
    console.log("\n⚡ Testing Performance");
    console.log("-".repeat(40));

    await this.runTest("Query Performance", async () => {
      const timestamp = Date.now();

      // Create tenant
      const tenant = await TenantService.createTenant({
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

      // Test tenant retrieval performance
      const startTime = Date.now();
      const retrievedTenant = await TenantService.getTenantById(tenant.id);
      const queryTime = Date.now() - startTime;

      if (queryTime > 1000) {
        // 1 second threshold
        throw new Error(`Tenant query too slow: ${queryTime}ms`);
      }

      if (!retrievedTenant) {
        throw new Error("Tenant not retrieved");
      }

      // Cleanup
      await TenantService.deleteTenant(tenant.id, true);
    });

    await this.runTest("Concurrent Operations", async () => {
      const timestamp = Date.now();

      // Create tenant
      const tenant = await TenantService.createTenant({
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

      // Test concurrent client creation
      const clientPromises = [];
      for (let i = 0; i < 3; i++) {
        clientPromises.push(
          ClientService.createClient({
            tenantId: tenant.id,
            name: `Concurrent Client ${i}`,
            email: `concurrent-client-${i}-${timestamp}@test.com`,
            status: "ACTIVE",
          })
        );
      }

      const clients = await Promise.all(clientPromises);

      if (clients.length !== 3) {
        throw new Error("Concurrent operations failed");
      }

      // Cleanup
      for (const client of clients) {
        await ClientService.deleteClient(client.id, true);
      }
      await TenantService.deleteTenant(tenant.id, true);
    });
  }
}

// Run validation if this file is executed directly
const validator = new MultiTenantValidator();
validator
  .runValidation()
  .then((results) => {
    if (results.failedTests === 0) {
      console.log(
        "\n🎉 All tests passed! Multi-tenant architecture is working correctly."
      );
      process.exit(0);
    } else {
      console.log(
        `\n❌ ${results.failedTests} test(s) failed. Please review and fix the issues.`
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Validation suite crashed:", error);
    process.exit(1);
  });

export { MultiTenantValidator };
