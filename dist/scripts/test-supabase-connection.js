"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
const supabase_1 = require("../lib/supabase");
async function testSupabaseConnection() {
    try {
        console.log("🔍 Testing Supabase connection...");
        console.log("📋 Environment variables:");
        console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing");
        console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing");
        console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
        console.log("\n🔗 Testing basic connection...");
        const { data, error } = await supabase_1.supabaseAdmin
            .from("tenants")
            .select("count")
            .limit(1);
        if (error) {
            console.error("❌ Connection test failed:", error);
            return false;
        }
        else {
            console.log("✅ Basic connection successful");
        }
        console.log("\n🔒 Checking RLS status...");
        const { data: rlsStatus, error: rlsError } = await supabase_1.supabaseAdmin.rpc("check_rls_status");
        if (rlsError) {
            console.log("⚠️ Could not check RLS status:", rlsError.message);
        }
        else {
            console.log("📊 RLS status:", rlsStatus);
        }
        console.log("\n🧪 Testing tenant creation...");
        const testTenantId = `test_connection_${Date.now()}`;
        const { data: tenant, error: tenantError } = await supabase_1.supabaseAdmin
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
            if (tenantError.message.includes("row-level security")) {
                console.log("\n🔍 This is an RLS policy issue. Let's check the policies...");
                const { data: policies, error: policyError } = await supabase_1.supabaseAdmin.rpc("get_table_policies", { table_name: "tenants" });
                if (policyError) {
                    console.log("⚠️ Could not retrieve policy information:", policyError.message);
                }
                else {
                    console.log("📋 Current policies:", policies);
                }
            }
            return false;
        }
        else {
            console.log("✅ Tenant creation successful!");
            console.log("📄 Created tenant:", tenant);
            const { error: deleteError } = await supabase_1.supabaseAdmin
                .from("tenants")
                .delete()
                .eq("id", testTenantId);
            if (deleteError) {
                console.log("⚠️ Could not clean up test tenant:", deleteError.message);
            }
            else {
                console.log("🧹 Test tenant cleaned up successfully");
            }
            return true;
        }
    }
    catch (error) {
        console.error("💥 Connection test crashed:", error);
        return false;
    }
}
async function checkSupabaseProject() {
    console.log("\n🔍 Checking Supabase project status...");
    try {
        const { data, error } = await supabase_1.supabaseAdmin.rpc("version");
        if (error) {
            console.log("⚠️  Could not get project version:");
            console.log(`   ${error.message}`);
        }
        else {
            console.log("✅ Supabase project is accessible");
            console.log(`   PostgreSQL version: ${data || "Unknown"}`);
        }
    }
    catch (error) {
        console.log("⚠️  Project status check failed:");
        console.log(`   ${error}`);
    }
}
console.log("🚀 Starting Supabase connection test...");
testSupabaseConnection()
    .then((success) => {
    if (success) {
        console.log("\n🎉 Supabase connection test passed!");
        process.exit(0);
    }
    else {
        console.log("\n❌ Supabase connection test failed.");
        process.exit(1);
    }
})
    .catch((error) => {
    console.error("\n💥 Connection test crashed:", error);
    process.exit(1);
});
//# sourceMappingURL=test-supabase-connection.js.map