import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";
import { UserService } from "../services/userService";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function createSuperAdmin() {
  try {
    console.log("🚀 Creating Super Admin User...");

    // First, check if we have any tenants
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug")
      .limit(1);

    if (tenantError) {
      console.error("❌ Error fetching tenants:", tenantError);
      throw tenantError;
    }

    let tenantId: string;

    if (!tenants || tenants.length === 0) {
      // Create a default tenant for super admin
      console.log("📦 No tenants found. Creating default tenant...");

      const { data: newTenant, error: createTenantError } = await supabaseAdmin
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
    } else {
      tenantId = tenants[0].id;
      console.log(`📍 Using existing tenant: ${tenants[0].name}`);
    }

    // Check if the user already exists
    const existingUser = await UserService.getUserByEmail(
      "gcortinez@getsweetspot.io",
      tenantId
    );

    if (existingUser) {
      console.log("⚠️  User already exists. Updating to SUPER_ADMIN role...");

      const updatedUser = await UserService.updateUser(existingUser.id, {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      });

      console.log(`✅ Updated user to SUPER_ADMIN: ${updatedUser.email}`);
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Tenant: ${updatedUser.tenant?.name}`);
      return;
    }

    // Create the super admin user
    const superAdmin = await UserService.createUser({
      email: "gcortinez@getsweetspot.io",
      password: "123456", // You should change this immediately after first login
      firstName: "Gustavo",
      lastName: "Cortinez",
      tenantId: tenantId,
      role: "SUPER_ADMIN",
      phone: undefined,
      avatar: undefined,
    });

    console.log("\n✅ Super Admin created successfully!");
    console.log("📧 Email: gcortinez@getsweetspot.io");
    console.log("🔑 Temporary Password: 123456");
    console.log("⚠️  Please change your password after first login!");
    console.log(`🏢 Tenant: ${superAdmin.tenant?.name}`);
    console.log(`🆔 User ID: ${superAdmin.id}`);
    console.log(`👤 Role: ${superAdmin.role}`);
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
