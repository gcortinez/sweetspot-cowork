import { supabaseAdmin } from "../lib/supabase";

async function debugRuntimeSupabase() {
  console.log("🔍 Debugging runtime Supabase client");
  console.log("================================================================================");

  const tenantId = "cmc4e452q0000e6c2roj7mmpg";

  try {
    console.log("\n1️⃣ Testing direct tenant query with runtime supabaseAdmin:");
    const { data: tenants1, error: error1 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId);

    console.log("Result:", {
      count: tenants1?.length || 0,
      error: error1?.message,
      data: tenants1,
    });

    console.log("\n2️⃣ Testing with .single():");
    const { data: tenant2, error: error2 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    console.log("Result:", {
      found: !!tenant2,
      error: error2?.message,
      errorCode: error2?.code,
      data: tenant2,
    });

    console.log("\n3️⃣ Testing all tenants query:");
    const { data: allTenants, error: error3 } = await supabaseAdmin
      .from("tenants")
      .select("id, name, status")
      .limit(5);

    console.log("Result:", {
      count: allTenants?.length || 0,
      error: error3?.message,
      tenants: allTenants?.map(t => `${t.id}: ${t.name} (${t.status})`),
    });

    console.log("\n4️⃣ Environment check:");
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Not set");
    console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set");
    console.log("Current working directory:", process.cwd());

  } catch (error) {
    console.error("❌ Error during debug:", error);
  }
}

// Run immediately when imported
debugRuntimeSupabase().catch(console.error);

// Export for use in auth service
export { debugRuntimeSupabase };