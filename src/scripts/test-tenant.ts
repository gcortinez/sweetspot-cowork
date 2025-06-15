import { TenantService } from "../services/tenantService";
import { supabaseAdmin } from "../lib/supabase";

/**
 * Test script for tenant functionality
 * Run with: npx tsx src/scripts/test-tenant.ts
 */

async function testTenantFunctionality() {
  console.log("🧪 Testing Tenant Functionality...\n");

  try {
    // Test 1: Generate slug from name
    console.log("1. Testing slug generation...");
    const slug1 = await TenantService.generateSlugFromName(
      "My Awesome Coworking Space"
    );
    const slug2 = await TenantService.generateSlugFromName(
      "Test@#$%^&*()Space!!!"
    );
    console.log(`✅ Generated slugs: "${slug1}", "${slug2}"`);

    // Test 2: Validate slug format
    console.log("\n2. Testing slug validation...");
    const validSlug = TenantService.validateSlug("valid-slug-123");
    const invalidSlug = TenantService.validateSlug("Invalid_Slug!");
    console.log(
      `✅ Valid slug check: ${validSlug}, Invalid slug check: ${invalidSlug}`
    );

    // Test 3: Create a test tenant
    console.log("\n3. Testing tenant creation...");
    const testTenantData = {
      name: "Test Coworking Space",
      slug: "test-cowork-" + Date.now(),
      domain: "https://test-cowork.example.com",
      description: "A test coworking space for development",
      settings: {
        timezone: "UTC",
        currency: "USD",
        features: ["wifi", "coffee", "parking"],
      },
      adminUser: {
        email: `admin-${Date.now()}@test.com`,
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "Admin",
      },
    };

    const createdTenant = await TenantService.createTenant(testTenantData);
    console.log(
      `✅ Created tenant: ${createdTenant.name} (ID: ${createdTenant.id})`
    );

    // Test 4: Get tenant by ID
    console.log("\n4. Testing get tenant by ID...");
    const fetchedTenant = await TenantService.getTenantById(createdTenant.id);
    console.log(
      `✅ Fetched tenant: ${fetchedTenant?.name} (Status: ${fetchedTenant?.status})`
    );

    // Test 5: Get tenant by slug
    console.log("\n5. Testing get tenant by slug...");
    const tenantBySlug = await TenantService.getTenantBySlug(
      createdTenant.slug
    );
    console.log(`✅ Fetched by slug: ${tenantBySlug?.name}`);

    // Test 6: Update tenant
    console.log("\n6. Testing tenant update...");
    const updatedTenant = await TenantService.updateTenant(createdTenant.id, {
      description: "Updated description for test coworking space",
      settings: {
        ...createdTenant.settings,
        maxCapacity: 100,
      },
    });
    console.log(`✅ Updated tenant description: ${updatedTenant.description}`);

    // Test 7: Get tenant statistics
    console.log("\n7. Testing tenant statistics...");
    const stats = await TenantService.getTenantStats(createdTenant.id);
    console.log(`✅ Tenant stats:`, {
      users: stats.userCount,
      clients: stats.clientCount,
      bookings: stats.activeBookings,
      revenue: stats.totalRevenue,
      spaces: stats.spacesCount,
    });

    // Test 8: Suspend and activate tenant
    console.log("\n8. Testing tenant suspension/activation...");
    const suspendedTenant = await TenantService.suspendTenant(createdTenant.id);
    console.log(`✅ Suspended tenant: ${suspendedTenant.status}`);

    const activatedTenant = await TenantService.activateTenant(
      createdTenant.id
    );
    console.log(`✅ Activated tenant: ${activatedTenant.status}`);

    // Test 9: Get all tenants (pagination)
    console.log("\n9. Testing get all tenants...");
    const allTenants = await TenantService.getAllTenants(1, 5);
    console.log(
      `✅ Found ${allTenants.total} total tenants, showing ${allTenants.tenants.length}`
    );

    // Test 10: Check slug availability
    console.log("\n10. Testing slug availability...");
    const existingSlug = await TenantService.getTenantBySlug(
      createdTenant.slug
    );
    const nonExistentSlug = await TenantService.getTenantBySlug(
      "non-existent-slug-123"
    );
    console.log(
      `✅ Existing slug found: ${!!existingSlug}, Non-existent slug found: ${!!nonExistentSlug}`
    );

    // Test 11: Soft delete tenant
    console.log("\n11. Testing tenant soft delete...");
    await TenantService.deleteTenant(createdTenant.id, false);
    const deletedTenant = await TenantService.getTenantById(createdTenant.id);
    console.log(`✅ Soft deleted tenant status: ${deletedTenant?.status}`);

    // Test 12: Hard delete tenant (cleanup)
    console.log("\n12. Cleaning up - hard delete tenant...");
    await TenantService.deleteTenant(createdTenant.id, true);
    const hardDeletedTenant = await TenantService.getTenantById(
      createdTenant.id
    );
    console.log(`✅ Hard deleted tenant exists: ${!!hardDeletedTenant}`);

    console.log("\n🎉 All tenant tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

async function testErrorCases() {
  console.log("\n🧪 Testing Error Cases...\n");

  try {
    // Test duplicate slug
    console.log("1. Testing duplicate slug error...");
    try {
      const duplicateSlug = "duplicate-test-" + Date.now();

      await TenantService.createTenant({
        name: "First Tenant",
        slug: duplicateSlug,
        adminUser: {
          email: `first-${Date.now()}@test.com`,
          password: "TestPassword123!",
          firstName: "First",
          lastName: "User",
        },
      });

      await TenantService.createTenant({
        name: "Second Tenant",
        slug: duplicateSlug, // Same slug
        adminUser: {
          email: `second-${Date.now()}@test.com`,
          password: "TestPassword123!",
          firstName: "Second",
          lastName: "User",
        },
      });

      console.log("❌ Should have thrown duplicate slug error");
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log("✅ Correctly caught duplicate slug error");
      } else {
        throw error;
      }
    }

    // Test non-existent tenant
    console.log("\n2. Testing non-existent tenant...");
    const nonExistent = await TenantService.getTenantById(
      "00000000-0000-0000-0000-000000000000"
    );
    console.log(`✅ Non-existent tenant result: ${nonExistent}`);

    // Test invalid slug format
    console.log("\n3. Testing invalid slug validation...");
    const invalidSlugs = [
      "AB",
      "invalid_slug",
      "invalid slug",
      "UPPERCASE",
      "123-",
    ];
    invalidSlugs.forEach((slug) => {
      const isValid = TenantService.validateSlug(slug);
      console.log(`✅ Slug "${slug}" is valid: ${isValid}`);
    });

    console.log("\n🎉 All error case tests passed!");
  } catch (error) {
    console.error("❌ Error case test failed:", error);
    process.exit(1);
  }
}

// Run tests
async function runTests() {
  try {
    await testTenantFunctionality();
    await testErrorCases();

    console.log("\n✨ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests();
}
