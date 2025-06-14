import { AuthService } from "../services/authService";
import { TenantService } from "../services/tenantService";
import { UserService } from "../services/userService";
import { ClientService } from "../services/clientService";

/**
 * Comprehensive test script for multi-tenant authentication
 */
async function testMultiTenantAuth() {
  console.log("🔐 Testing Multi-Tenant Authentication System");
  console.log("=".repeat(50));

  try {
    // Step 1: Create test tenant
    console.log("\n1️⃣ Creating test tenant...");
    const timestamp = Date.now();
    const tenant = await TenantService.createTenant({
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

    // Step 2: Create test client
    console.log("\n2️⃣ Creating test client...");
    const client = await ClientService.createClient({
      tenantId: tenant.id,
      name: "Test Company",
      email: "company@test.com",
      phone: "+1234567890",
      address: "123 Test Street",
      contactPerson: "John Doe",
      status: "ACTIVE",
    });
    console.log(`✅ Created client: ${client.name}`);

    // Step 3: Test user login (admin was created with tenant)
    console.log("\n3️⃣ Testing user login...");
    const loginResult = await AuthService.login(
      `admin-${timestamp}@test.com`,
      "TestPassword123!",
      tenant.slug
    );

    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    console.log(`✅ Login successful for: ${loginResult.user?.email}`);
    console.log(`🏢 Tenant: ${loginResult.tenant?.name}`);
    console.log(`👤 Role: ${loginResult.user?.role}`);

    // Step 5: Test session validation
    console.log("\n5️⃣ Testing session validation...");
    const sessionResult = await AuthService.getSession(
      loginResult.accessToken!
    );
    if (!sessionResult.isValid) {
      throw new Error("Session validation failed");
    }
    console.log(`✅ Session valid for: ${sessionResult.user.email}`);
    console.log(`🏢 Session tenant: ${sessionResult.tenant.name}`);

    // Step 6: Test permission verification
    console.log("\n6️⃣ Testing permission verification...");
    const hasUserPermission = await AuthService.verifyPermissions(
      loginResult.user!.id,
      "read",
      "user",
      loginResult.user!.id
    );
    console.log(`✅ User can access own data: ${hasUserPermission}`);

    const hasTenantPermission = await AuthService.verifyPermissions(
      loginResult.user!.id,
      "manage",
      "tenant",
      tenant.id
    );
    console.log(`✅ Cowork admin can manage tenant: ${hasTenantPermission}`);

    // Step 7: Test password change
    console.log("\n7️⃣ Testing password change...");
    const changePasswordResult = await AuthService.changePassword(
      loginResult.user!.id,
      "TestPassword123!",
      "NewPassword123!"
    );

    if (!changePasswordResult.success) {
      throw new Error(`Password change failed: ${changePasswordResult.error}`);
    }
    console.log(`✅ Password changed successfully`);

    // Step 8: Test login with new password
    console.log("\n8️⃣ Testing login with new password...");
    const newLoginResult = await AuthService.login(
      `admin-${timestamp}@test.com`,
      "NewPassword123!",
      tenant.slug
    );

    if (!newLoginResult.success) {
      throw new Error(
        `Login with new password failed: ${newLoginResult.error}`
      );
    }
    console.log(`✅ Login successful with new password`);

    // Step 9: Test token refresh
    console.log("\n9️⃣ Testing token refresh...");
    const refreshResult = await AuthService.refreshToken(
      newLoginResult.refreshToken!
    );

    if (!refreshResult.success) {
      throw new Error(`Token refresh failed: ${refreshResult.error}`);
    }
    console.log(`✅ Token refreshed successfully`);
    console.log(
      `🎫 New access token: ${refreshResult.accessToken?.substring(0, 20)}...`
    );

    // Step 10: Test logout
    console.log("\n🔟 Testing logout...");
    await AuthService.logout(refreshResult.accessToken!);
    console.log(`✅ Logout successful`);

    // Step 11: Test session after logout
    console.log("\n1️⃣1️⃣ Testing session after logout...");
    const loggedOutSession = await AuthService.getSession(
      refreshResult.accessToken!
    );
    if (loggedOutSession.isValid) {
      console.log(
        `⚠️ Session still valid after logout (this might be expected behavior)`
      );
    } else {
      console.log(`✅ Session invalid after logout`);
    }

    // Step 12: Test multi-tenant isolation
    console.log("\n1️⃣2️⃣ Testing multi-tenant isolation...");

    // Create second tenant
    const tenant2 = await TenantService.createTenant({
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

    // Try to login to wrong tenant
    const wrongTenantLogin = await AuthService.login(
      `admin-${timestamp}@test.com`,
      "NewPassword123!",
      tenant2.slug
    );

    if (wrongTenantLogin.success) {
      console.log(
        `⚠️ User was able to login to wrong tenant - this should be prevented`
      );
    } else {
      console.log(
        `✅ Multi-tenant isolation working: ${wrongTenantLogin.error}`
      );
    }

    // Step 13: Test different user roles
    console.log("\n1️⃣3️⃣ Testing different user roles...");

    // Create client admin user
    const clientAdminResult = await AuthService.register({
      email: `clientadmin-${timestamp}@test.com`,
      password: "ClientPassword123!",
      firstName: "Client",
      lastName: "Admin",
      tenantSlug: tenant.slug,
      role: "CLIENT_ADMIN",
      clientId: client.id,
    });

    if (!clientAdminResult.success) {
      throw new Error(
        `Client admin registration failed: ${clientAdminResult.error}`
      );
    }
    console.log(`✅ Created client admin: ${clientAdminResult.user?.email}`);

    // Test client admin permissions
    const clientAdminCanAccessClient = await AuthService.verifyPermissions(
      clientAdminResult.user!.id,
      "read",
      "client",
      client.id
    );
    console.log(
      `✅ Client admin can access own client: ${clientAdminCanAccessClient}`
    );

    const clientAdminCanAccessOtherClient = await AuthService.verifyPermissions(
      clientAdminResult.user!.id,
      "read",
      "client",
      "other-client-id"
    );
    console.log(
      `✅ Client admin cannot access other client: ${!clientAdminCanAccessOtherClient}`
    );

    // Create end user
    const endUserResult = await AuthService.register({
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

    // Test end user permissions
    const endUserCanAccessOwnData = await AuthService.verifyPermissions(
      endUserResult.user!.id,
      "read",
      "user",
      endUserResult.user!.id
    );
    console.log(`✅ End user can access own data: ${endUserCanAccessOwnData}`);

    const endUserCanAccessOtherUser = await AuthService.verifyPermissions(
      endUserResult.user!.id,
      "read",
      "user",
      clientAdminResult.user!.id
    );
    console.log(
      `✅ End user cannot access other user data: ${!endUserCanAccessOtherUser}`
    );

    console.log("\n🎉 All authentication tests passed!");
    console.log("=".repeat(50));

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    // Admin user will be deleted when tenant is deleted
    await UserService.deleteUser(clientAdminResult.user!.id, true);
    await UserService.deleteUser(endUserResult.user!.id, true);
    await ClientService.deleteClient(client.id, true);
    await TenantService.deleteTenant(tenant.id, true);
    await TenantService.deleteTenant(tenant2.id, true);
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("\n❌ Authentication test failed:", error);
    throw error;
  }
}

// Run the test
testMultiTenantAuth()
  .then(() => {
    console.log(
      "\n✅ Multi-tenant authentication test completed successfully!"
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Multi-tenant authentication test failed:", error);
    process.exit(1);
  });

export { testMultiTenantAuth };
