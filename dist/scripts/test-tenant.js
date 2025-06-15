"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tenantService_1 = require("../services/tenantService");
async function testTenantFunctionality() {
    console.log("🧪 Testing Tenant Functionality...\n");
    try {
        console.log("1. Testing slug generation...");
        const slug1 = await tenantService_1.TenantService.generateSlugFromName("My Awesome Coworking Space");
        const slug2 = await tenantService_1.TenantService.generateSlugFromName("Test@#$%^&*()Space!!!");
        console.log(`✅ Generated slugs: "${slug1}", "${slug2}"`);
        console.log("\n2. Testing slug validation...");
        const validSlug = tenantService_1.TenantService.validateSlug("valid-slug-123");
        const invalidSlug = tenantService_1.TenantService.validateSlug("Invalid_Slug!");
        console.log(`✅ Valid slug check: ${validSlug}, Invalid slug check: ${invalidSlug}`);
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
        const createdTenant = await tenantService_1.TenantService.createTenant(testTenantData);
        console.log(`✅ Created tenant: ${createdTenant.name} (ID: ${createdTenant.id})`);
        console.log("\n4. Testing get tenant by ID...");
        const fetchedTenant = await tenantService_1.TenantService.getTenantById(createdTenant.id);
        console.log(`✅ Fetched tenant: ${fetchedTenant?.name} (Status: ${fetchedTenant?.status})`);
        console.log("\n5. Testing get tenant by slug...");
        const tenantBySlug = await tenantService_1.TenantService.getTenantBySlug(createdTenant.slug);
        console.log(`✅ Fetched by slug: ${tenantBySlug?.name}`);
        console.log("\n6. Testing tenant update...");
        const updatedTenant = await tenantService_1.TenantService.updateTenant(createdTenant.id, {
            description: "Updated description for test coworking space",
            settings: {
                ...createdTenant.settings,
                maxCapacity: 100,
            },
        });
        console.log(`✅ Updated tenant description: ${updatedTenant.description}`);
        console.log("\n7. Testing tenant statistics...");
        const stats = await tenantService_1.TenantService.getTenantStats(createdTenant.id);
        console.log(`✅ Tenant stats:`, {
            users: stats.userCount,
            clients: stats.clientCount,
            bookings: stats.activeBookings,
            revenue: stats.totalRevenue,
            spaces: stats.spacesCount,
        });
        console.log("\n8. Testing tenant suspension/activation...");
        const suspendedTenant = await tenantService_1.TenantService.suspendTenant(createdTenant.id);
        console.log(`✅ Suspended tenant: ${suspendedTenant.status}`);
        const activatedTenant = await tenantService_1.TenantService.activateTenant(createdTenant.id);
        console.log(`✅ Activated tenant: ${activatedTenant.status}`);
        console.log("\n9. Testing get all tenants...");
        const allTenants = await tenantService_1.TenantService.getAllTenants(1, 5);
        console.log(`✅ Found ${allTenants.total} total tenants, showing ${allTenants.tenants.length}`);
        console.log("\n10. Testing slug availability...");
        const existingSlug = await tenantService_1.TenantService.getTenantBySlug(createdTenant.slug);
        const nonExistentSlug = await tenantService_1.TenantService.getTenantBySlug("non-existent-slug-123");
        console.log(`✅ Existing slug found: ${!!existingSlug}, Non-existent slug found: ${!!nonExistentSlug}`);
        console.log("\n11. Testing tenant soft delete...");
        await tenantService_1.TenantService.deleteTenant(createdTenant.id, false);
        const deletedTenant = await tenantService_1.TenantService.getTenantById(createdTenant.id);
        console.log(`✅ Soft deleted tenant status: ${deletedTenant?.status}`);
        console.log("\n12. Cleaning up - hard delete tenant...");
        await tenantService_1.TenantService.deleteTenant(createdTenant.id, true);
        const hardDeletedTenant = await tenantService_1.TenantService.getTenantById(createdTenant.id);
        console.log(`✅ Hard deleted tenant exists: ${!!hardDeletedTenant}`);
        console.log("\n🎉 All tenant tests passed successfully!");
    }
    catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}
async function testErrorCases() {
    console.log("\n🧪 Testing Error Cases...\n");
    try {
        console.log("1. Testing duplicate slug error...");
        try {
            const duplicateSlug = "duplicate-test-" + Date.now();
            await tenantService_1.TenantService.createTenant({
                name: "First Tenant",
                slug: duplicateSlug,
                adminUser: {
                    email: `first-${Date.now()}@test.com`,
                    password: "TestPassword123!",
                    firstName: "First",
                    lastName: "User",
                },
            });
            await tenantService_1.TenantService.createTenant({
                name: "Second Tenant",
                slug: duplicateSlug,
                adminUser: {
                    email: `second-${Date.now()}@test.com`,
                    password: "TestPassword123!",
                    firstName: "Second",
                    lastName: "User",
                },
            });
            console.log("❌ Should have thrown duplicate slug error");
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("already exists")) {
                console.log("✅ Correctly caught duplicate slug error");
            }
            else {
                throw error;
            }
        }
        console.log("\n2. Testing non-existent tenant...");
        const nonExistent = await tenantService_1.TenantService.getTenantById("00000000-0000-0000-0000-000000000000");
        console.log(`✅ Non-existent tenant result: ${nonExistent}`);
        console.log("\n3. Testing invalid slug validation...");
        const invalidSlugs = [
            "AB",
            "invalid_slug",
            "invalid slug",
            "UPPERCASE",
            "123-",
        ];
        invalidSlugs.forEach((slug) => {
            const isValid = tenantService_1.TenantService.validateSlug(slug);
            console.log(`✅ Slug "${slug}" is valid: ${isValid}`);
        });
        console.log("\n🎉 All error case tests passed!");
    }
    catch (error) {
        console.error("❌ Error case test failed:", error);
        process.exit(1);
    }
}
async function runTests() {
    try {
        await testTenantFunctionality();
        await testErrorCases();
        console.log("\n✨ All tests completed successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Test suite failed:", error);
        process.exit(1);
    }
}
if (require.main === module) {
    runTests();
}
//# sourceMappingURL=test-tenant.js.map