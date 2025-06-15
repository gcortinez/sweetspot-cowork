import dotenv from "dotenv";
import { TenantService } from "../services/tenantService.js";
import { UserService } from "../services/userService.js";
import { ClientService } from "../services/clientService.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testServices() {
  console.log("🧪 Testing Supabase Services...\n");

  try {
    // Test 1: Create a test tenant
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

    const tenant = await TenantService.createTenant(tenantData);
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);

    // Test 2: Create a test client
    console.log("\n2. Testing Client Service...");
    const clientData = {
      name: "Test Client Corp",
      email: "client@test-services.com",
      tenantId: tenant.id,
      phone: "+1-555-0123",
      contactPerson: "John Client",
      status: "ACTIVE" as const,
    };

    const client = await ClientService.createClient(clientData);
    console.log(`✅ Created client: ${client.name} (${client.id})`);

    // Test 3: Get the admin user and create additional user
    console.log("\n3. Testing User Service...");

    // Get the admin user that was created with the tenant
    const adminUser = await UserService.getUserByEmail(
      "admin@test-services.com",
      tenant.id
    );
    if (!adminUser) {
      throw new Error("Admin user not found after tenant creation");
    }
    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);

    // Create client user
    const clientUserData = {
      email: "user@test-services.com",
      password: "TestPassword123!",
      firstName: "Client",
      lastName: "User",
      tenantId: tenant.id,
      role: "END_USER" as const,
      clientId: client.id,
    };

    const clientUser = await UserService.createUser(clientUserData);
    console.log(
      `✅ Created client user: ${clientUser.email} (${clientUser.id})`
    );

    // Test 4: Data retrieval and statistics
    console.log("\n4. Testing Data Retrieval...");

    // Get tenant by slug
    const tenantBySlug = await TenantService.getTenantBySlug(tenant.slug);
    console.log(`✅ Retrieved tenant by slug: ${tenantBySlug?.name}`);

    // Get tenant statistics
    const tenantStats = await TenantService.getTenantStats(tenant.id);
    console.log(
      `✅ Tenant stats: ${tenantStats.userCount} users, ${tenantStats.clientCount} clients`
    );

    // Get users by tenant
    const usersResult = await UserService.getUsersByTenant(tenant.id, 1, 10);
    console.log(`✅ Retrieved ${usersResult.users.length} users for tenant`);

    // Get user statistics
    const userStats = await UserService.getUserStats(tenant.id);
    console.log(
      `✅ User stats: ${userStats.totalUsers} total, ${userStats.activeUsers} active`
    );

    // Get clients by tenant
    const clientsResult = await ClientService.getClientsByTenant(
      tenant.id,
      1,
      10
    );
    console.log(
      `✅ Retrieved ${clientsResult.clients.length} clients for tenant`
    );

    // Get client statistics
    const clientStats = await ClientService.getClientStats(tenant.id);
    console.log(
      `✅ Client stats: ${clientStats.totalClients} total, ${clientStats.activeClients} active`
    );

    // Test 5: Updates and modifications
    console.log("\n5. Testing Updates...");

    // Update tenant
    const updatedTenant = await TenantService.updateTenant(tenant.id, {
      description: "Updated description for service test",
    });
    console.log(`✅ Updated tenant description`);

    // Update user
    const updatedUser = await UserService.updateUser(clientUser.id, {
      phone: "+1-555-9999",
    });
    console.log(`✅ Updated user phone number to: ${updatedUser.phone}`);

    // Update client
    const updatedClient = await ClientService.updateClient(client.id, {
      status: "PROSPECT",
    });
    console.log(`✅ Updated client status to: ${updatedClient.status}`);

    // Test 6: Search and filtering
    console.log("\n6. Testing Search and Filtering...");

    // Get users by role
    const adminUsers = await UserService.getUsersByTenant(
      tenant.id,
      1,
      10,
      "COWORK_ADMIN"
    );
    console.log(`✅ Found ${adminUsers.users.length} admin users`);

    // Get clients by status
    const prospectClients = await ClientService.getClientsByTenant(
      tenant.id,
      1,
      10,
      "PROSPECT"
    );
    console.log(`✅ Found ${prospectClients.clients.length} prospect clients`);

    // Search clients
    const searchResults = await ClientService.getClientsByTenant(
      tenant.id,
      1,
      10,
      undefined,
      "Test Client"
    );
    console.log(
      `✅ Search found ${searchResults.clients.length} clients matching 'Test Client'`
    );

    // Test 7: Status management
    console.log("\n7. Testing Status Management...");

    // Suspend user
    const suspendedUser = await UserService.suspendUser(clientUser.id);
    console.log(`✅ Suspended user: ${suspendedUser.status}`);

    // Activate user
    const activatedUser = await UserService.activateUser(clientUser.id);
    console.log(`✅ Activated user: ${activatedUser.status}`);

    // Convert client to prospect (already done above)
    const activatedClient = await ClientService.activateClient(client.id);
    console.log(`✅ Activated client: ${activatedClient.status}`);

    // Test 8: Cleanup
    console.log("\n8. Testing Cleanup...");

    // Delete users (hard delete for cleanup)
    await UserService.deleteUser(adminUser.id, true);
    await UserService.deleteUser(clientUser.id, true);
    console.log(`✅ Deleted test users`);

    // Delete client
    await ClientService.deleteClient(client.id, true);
    console.log(`✅ Deleted test client`);

    // Delete tenant
    await TenantService.deleteTenant(tenant.id, true);
    console.log(`✅ Deleted test tenant`);

    console.log("\n🎉 All service tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Service test failed:", error);
    process.exit(1);
  }
}

// Run the test
testServices()
  .then(() => {
    console.log("\n✅ Service test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Service test failed:", error);
    process.exit(1);
  });
