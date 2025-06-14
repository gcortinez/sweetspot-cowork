import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config({ path: ".env.local" });

import { supabaseAdmin, supabase } from "../lib/supabase";

/**
 * Test Supabase connection and diagnose issues
 */
async function testSupabaseConnection() {
  try {
    console.log("🔍 Testing Supabase connection...");

    // Check environment variables
    console.log("📋 Environment variables:");
    console.log(
      "SUPABASE_URL:",
      process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "SUPABASE_ANON_KEY:",
      process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
    );

    // Test basic connection
    console.log("\n🔗 Testing basic connection...");
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Connection test failed:", error);
      return false;
    } else {
      console.log("✅ Basic connection successful");
    }

    // Test RLS status
    console.log("\n🔒 Checking RLS status...");
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc(
      "check_rls_status"
    );

    if (rlsError) {
      console.log("⚠️ Could not check RLS status:", rlsError.message);
    } else {
      console.log("📊 RLS status:", rlsStatus);
    }

    // Test tenant creation with detailed error info
    console.log("\n🧪 Testing tenant creation...");
    const testTenantId = `test_connection_${Date.now()}`;

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        id: testTenantId,
        name: "Connection Test Tenant",
        slug: `connection-test-${Date.now()}`,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (tenantError) {
      console.error("❌ Tenant creation failed:");
      console.error("  Code:", tenantError.code);
      console.error("  Message:", tenantError.message);
      console.error("  Details:", tenantError.details);
      console.error("  Hint:", tenantError.hint);

      // Check if it's an RLS issue
      if (tenantError.message.includes("row-level security")) {
        console.log(
          "\n🔍 This is an RLS policy issue. Let's check the policies..."
        );

        // Try to get information about current policies
        const { data: policies, error: policyError } = await supabaseAdmin.rpc(
          "get_table_policies",
          { table_name: "tenants" }
        );

        if (policyError) {
          console.log(
            "⚠️ Could not retrieve policy information:",
            policyError.message
          );
        } else {
          console.log("📋 Current policies:", policies);
        }
      }

      return false;
    } else {
      console.log("✅ Tenant creation successful!");
      console.log("📄 Created tenant:", tenant);

      // Clean up
      const { error: deleteError } = await supabaseAdmin
        .from("tenants")
        .delete()
        .eq("id", testTenantId);

      if (deleteError) {
        console.log("⚠️ Could not clean up test tenant:", deleteError.message);
      } else {
        console.log("🧹 Test tenant cleaned up successfully");
      }

      return true;
    }
  } catch (error) {
    console.error("💥 Connection test crashed:", error);
    return false;
  }
}

async function checkSupabaseProject() {
  console.log("\n🔍 Checking Supabase project status...");

  try {
    // Try to get project info
    const { data, error } = await supabaseAdmin.rpc("version");

    if (error) {
      console.log("⚠️  Could not get project version:");
      console.log(`   ${error.message}`);
    } else {
      console.log("✅ Supabase project is accessible");
      console.log(`   PostgreSQL version: ${data || "Unknown"}`);
    }
  } catch (error) {
    console.log("⚠️  Project status check failed:");
    console.log(`   ${error}`);
  }
}

// Run the test
console.log("🚀 Starting Supabase connection test...");

testSupabaseConnection()
  .then((success) => {
    if (success) {
      console.log("\n🎉 Supabase connection test passed!");
      process.exit(0);
    } else {
      console.log("\n❌ Supabase connection test failed.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Connection test crashed:", error);
    process.exit(1);
  });
