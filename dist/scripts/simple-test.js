"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tenantService_1 = require("../services/tenantService");
const userService_1 = require("../services/userService");
async function createTestData() {
    try {
        console.log("🔧 Creating test data for authentication testing...");
        console.log("1️⃣ Creating test tenant...");
        const tenant = await tenantService_1.TenantService.createTenant({
            name: "Demo Coworking",
            slug: "demo",
            adminUser: {
                email: "admin@demo.com",
                password: "password123",
                firstName: "Admin",
                lastName: "User",
            },
        });
        console.log("✅ Created tenant:", tenant.name, `(${tenant.slug})`);
        console.log("2️⃣ Creating test end user...");
        const endUser = await userService_1.UserService.createUser({
            email: "user@demo.com",
            password: "password123",
            firstName: "Test",
            lastName: "User",
            tenantId: tenant.id,
            role: "END_USER",
        });
        console.log("✅ Created end user:", endUser.email);
        console.log("\\n🎉 Test data created successfully!");
        console.log("\\n📋 Test Credentials:");
        console.log("Tenant Slug: demo");
        console.log("Admin: admin@demo.com / password123");
        console.log("End User: user@demo.com / password123");
    }
    catch (error) {
        console.error("❌ Error creating test data:", error);
    }
}
createTestData();
//# sourceMappingURL=simple-test.js.map