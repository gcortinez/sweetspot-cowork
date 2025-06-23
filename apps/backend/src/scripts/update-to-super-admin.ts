import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function updateToSuperAdmin() {
  try {
    console.log("🚀 Updating user to Super Admin...");

    // First, find the user in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("❌ Error listing auth users:", authError);
      throw authError;
    }

    const authUser = authUsers.users.find(u => u.email === "gcortinez@getsweetspot.io");
    
    if (!authUser) {
      console.error("❌ User not found in auth.users");
      return;
    }

    console.log(`✅ Found auth user: ${authUser.email} (${authUser.id})`);

    // Check if user exists in public.users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "gcortinez@getsweetspot.io")
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("❌ Error checking user:", userError);
      throw userError;
    }

    // Get a tenant
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug")
      .limit(1);

    let tenantId: string;
    let tenantName: string;

    if (tenantError || !tenants || tenants.length === 0) {
      console.error("❌ No tenants found. Creating one...");
      
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
        throw createTenantError || new Error("Failed to create tenant");
      }
      
      tenantId = newTenant.id;
      tenantName = newTenant.name;
    } else {
      tenantId = tenants[0].id;
      tenantName = tenants[0].name;
    }

    console.log(`📍 Using tenant: ${tenantName}`);

    if (existingUser) {
      // Update existing user
      console.log("📝 Updating existing user to SUPER_ADMIN...");
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          updatedAt: new Date().toISOString()
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating user:", updateError);
        throw updateError;
      }

      console.log("\n✅ User updated successfully!");
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`🆔 User ID: ${updatedUser.id}`);
      console.log(`👤 Role: ${updatedUser.role}`);
      console.log(`🏢 Tenant ID: ${updatedUser.tenantId}`);
    } else {
      // Create user in public.users table
      console.log("📝 Creating user in public.users table...");
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authUser.id, // Use the auth user's ID
          supabaseId: authUser.id, // Required field
          email: "gcortinez@getsweetspot.io",
          firstName: "Gustavo",
          lastName: "Cortinez",
          tenantId: tenantId,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating user:", createError);
        throw createError;
      }

      console.log("\n✅ User created successfully!");
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`🆔 User ID: ${newUser.id}`);
      console.log(`👤 Role: ${newUser.role}`);
      console.log(`🏢 Tenant ID: ${newUser.tenantId}`);
    }

    // Update password if needed
    console.log("\n🔑 Updating password...");
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: "123456" }
    );

    if (passwordError) {
      console.error("❌ Error updating password:", passwordError);
      console.log("⚠️  You may need to reset your password manually");
    } else {
      console.log("✅ Password updated to: 123456");
      console.log("⚠️  Please change your password after first login!");
    }

  } catch (error) {
    console.error("❌ Error in update process:", error);
    process.exit(1);
  }
}

// Run the script
updateToSuperAdmin()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    console.log("🚀 You can now login with:");
    console.log("   Email: gcortinez@getsweetspot.io");
    console.log("   Password: 123456");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });