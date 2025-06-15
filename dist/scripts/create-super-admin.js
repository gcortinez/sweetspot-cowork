"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const supabase_1 = require("../lib/supabase");
const userService_1 = require("../services/userService");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, "../../.env") });
async function createSuperAdmin() {
    try {
        console.log("🚀 Creating Super Admin User...");
        const { data: tenants, error: tenantError } = await supabase_1.supabaseAdmin
            .from("tenants")
            .select("id, name, slug")
            .limit(1);
        if (tenantError) {
            console.error("❌ Error fetching tenants:", tenantError);
            throw tenantError;
        }
        let tenantId;
        if (!tenants || tenants.length === 0) {
            console.log("📦 No tenants found. Creating default tenant...");
            const { data: newTenant, error: createTenantError } = await supabase_1.supabaseAdmin
                .from("tenants")
                .insert({
                id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: "SweetSpot HQ",
                slug: "sweetspot-hq",
                settings: {
                    features: {
                        bookings: true,
                        members: true,
                        spaces: true,
                        billing: true,
                        analytics: true,
                    },
                    branding: {
                        primaryColor: "#006BFF",
                        logo: null,
                    },
                },
                status: "ACTIVE",
            })
                .select()
                .single();
            if (createTenantError || !newTenant) {
                console.error("❌ Error creating tenant:", createTenantError);
                throw createTenantError;
            }
            tenantId = newTenant.id;
            console.log(`✅ Created tenant: ${newTenant.name} (${newTenant.slug})`);
        }
        else {
            tenantId = tenants[0].id;
            console.log(`📍 Using existing tenant: ${tenants[0].name}`);
        }
        const existingUser = await userService_1.UserService.getUserByEmail("gcortinez@getsweetspot.io", tenantId);
        if (existingUser) {
            console.log("⚠️  User already exists. Updating to SUPER_ADMIN role...");
            const updatedUser = await userService_1.UserService.updateUser(existingUser.id, {
                role: "SUPER_ADMIN",
                status: "ACTIVE",
            });
            console.log(`✅ Updated user to SUPER_ADMIN: ${updatedUser.email}`);
            console.log(`   ID: ${updatedUser.id}`);
            console.log(`   Tenant: ${updatedUser.tenant?.name}`);
            return;
        }
        const superAdmin = await userService_1.UserService.createUser({
            email: "gcortinez@getsweetspot.io",
            password: "123456",
            firstName: "Gustavo",
            lastName: "Cortinez",
            tenantId: tenantId,
            role: "SUPER_ADMIN",
            phone: undefined,
            avatar: undefined,
        });
        console.log("\n✅ Super Admin created successfully!");
        console.log("📧 Email: gcortinez@getsweetspot.io");
        console.log("🔑 Temporary Password: TempPassword123!");
        console.log("⚠️  Please change your password after first login!");
        console.log(`🏢 Tenant: ${superAdmin.tenant?.name}`);
        console.log(`🆔 User ID: ${superAdmin.id}`);
        console.log(`👤 Role: ${superAdmin.role}`);
    }
    catch (error) {
        console.error("❌ Error creating super admin:", error);
        process.exit(1);
    }
}
createSuperAdmin()
    .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
//# sourceMappingURL=create-super-admin.js.map