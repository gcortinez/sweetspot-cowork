import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function fixTenantIssue() {
  try {
    console.log("🔍 Investigating tenant issue...");

    // First, find the user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "gcortinez@getsweetspot.io")
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`📍 Current tenantId: ${user.tenantId}`);

    // Check if the tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", user.tenantId)
      .single();

    if (tenantError || !tenant) {
      console.log("❌ Tenant not found. Creating it...");
      
      // Create the missing tenant
      const { data: newTenant, error: createError } = await supabaseAdmin
        .from("tenants")
        .insert({
          id: user.tenantId, // Use the same ID that the user references
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating tenant:", createError);
        throw createError;
      }

      console.log(`✅ Created tenant: ${newTenant.name} (${newTenant.id})`);
    } else {
      console.log(`✅ Tenant exists: ${tenant.name} (${tenant.id})`);
    }

    // Verify everything is working now
    console.log("\n🔍 Final verification...");
    
    // Check user again
    const { data: finalUser, error: finalUserError } = await supabaseAdmin
      .from("users")
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq("email", "gcortinez@getsweetspot.io")
      .single();

    if (finalUserError) {
      console.error("❌ Final user check failed:", finalUserError);
      return;
    }

    console.log("✅ Final verification successful:");
    console.log(`📧 User: ${finalUser.email}`);
    console.log(`👤 Role: ${finalUser.role}`);
    console.log(`🏢 Tenant: ${finalUser.tenant?.name || 'Not found'}`);
    console.log(`🆔 Tenant ID: ${finalUser.tenantId}`);

    if (!finalUser.tenant) {
      console.error("❌ Tenant relationship still not working");
    } else {
      console.log("✅ Everything looks good! Login should work now.");
    }

  } catch (error) {
    console.error("❌ Error fixing tenant issue:", error);
    process.exit(1);
  }
}

// Run the script
fixTenantIssue()
  .then(() => {
    console.log("\n✨ Tenant fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });