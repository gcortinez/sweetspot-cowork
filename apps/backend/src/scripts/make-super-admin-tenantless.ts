import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function makeSuperAdminTenantless() {
  try {
    console.log("🔧 Making Super Admin independent of tenants...");

    // Find and update the Super Admin user
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        tenantId: null, // Remove tenant association
        updatedAt: new Date().toISOString()
      })
      .eq("email", "gcortinez@getsweetspot.io")
      .eq("role", "SUPER_ADMIN")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      throw updateError;
    }

    if (!updatedUser) {
      console.error("❌ Super Admin user not found");
      return;
    }

    console.log("✅ Super Admin updated successfully:");
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Role: ${updatedUser.role}`);
    console.log(`🏢 Tenant ID: ${updatedUser.tenantId || 'null (independent)'}`);
    console.log(`🆔 User ID: ${updatedUser.id}`);

    // Verify the change
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "gcortinez@getsweetspot.io")
      .single();

    if (verifyError || !verifyUser) {
      console.error("❌ Verification failed:", verifyError);
      return;
    }

    console.log("\n✅ Verification successful:");
    console.log(`  - Email: ${verifyUser.email}`);
    console.log(`  - Role: ${verifyUser.role}`);
    console.log(`  - Tenant ID: ${verifyUser.tenantId || 'null (independent)'}`);
    console.log(`  - Status: ${verifyUser.status}`);

    if (verifyUser.tenantId === null && verifyUser.role === "SUPER_ADMIN") {
      console.log("\n🎉 Perfect! Super Admin is now tenant-independent and should be able to login.");
    } else {
      console.log("\n⚠️ Something might be wrong. Check the user data above.");
    }

  } catch (error) {
    console.error("❌ Error making Super Admin tenantless:", error);
    process.exit(1);
  }
}

// Run the script
makeSuperAdminTenantless()
  .then(() => {
    console.log("\n✨ Script completed!");
    console.log("🚀 You can now login as Super Admin with:");
    console.log("   Email: gcortinez@getsweetspot.io");
    console.log("   Password: 123456");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });