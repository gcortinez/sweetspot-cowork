import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugTenantQuery() {
  const tenantId = "cmc4e452q0000e6c2roj7mmpg";
  const email = "gcortinez@gmail.com";

  console.log("🔍 Debugging tenant query issue");
  console.log("Tenant ID:", tenantId);
  console.log("User email:", email);
  console.log("================================================================================");

  try {
    // 1. Direct tenant query (same as TenantService.getTenantById)
    console.log("\n1️⃣ Direct tenant query with count (TenantService pattern):");
    const { data: tenant1, error: error1 } = await supabaseAdmin
      .from("tenants")
      .select(
        `
        *,
        users:users(count),
        clients:clients(count)
      `
      )
      .eq("id", tenantId)
      .single();

    console.log("Result:", {
      found: !!tenant1,
      error: error1?.message,
      data: tenant1 ? {
        id: tenant1.id,
        name: tenant1.name,
        status: tenant1.status,
        users: tenant1.users,
        clients: tenant1.clients,
      } : null,
    });

    // 2. Simple tenant query without counts
    console.log("\n2️⃣ Simple tenant query without counts:");
    const { data: tenant2, error: error2 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    console.log("Result:", {
      found: !!tenant2,
      error: error2?.message,
      data: tenant2 ? {
        id: tenant2.id,
        name: tenant2.name,
        status: tenant2.status,
      } : null,
    });

    // 3. Check if the issue is with the single() method
    console.log("\n3️⃣ Query without single():");
    const { data: tenants3, error: error3 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId);

    console.log("Result:", {
      count: tenants3?.length || 0,
      error: error3?.message,
      data: tenants3,
    });

    // 4. Try with RLS off (using service role should bypass RLS)
    console.log("\n4️⃣ Explicit RLS bypass query:");
    const { data: tenant4, error: error4 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    console.log("Result:", {
      found: !!tenant4,
      error: error4?.message,
      data: tenant4,
    });

    // 5. Check the RPC function mentioned in AuthService
    console.log("\n5️⃣ Testing RPC function 'get_user_by_email':");
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "get_user_by_email",
      {
        user_email: email,
      }
    );

    console.log("RPC Result:", {
      exists: !rpcError?.message?.includes("does not exist"),
      error: rpcError?.message,
      dataCount: rpcData?.length || 0,
      data: rpcData,
    });

    // 6. Test the auth flow directly in the same way as AuthService
    console.log("\n6️⃣ Testing exact auth service flow:");
    
    // First get user records
    const { data: directUsers, error: directError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("status", "ACTIVE");

    console.log("User query result:", {
      count: directUsers?.length || 0,
      error: directError?.message,
    });

    if (directUsers && directUsers.length > 0) {
      const userRecord = directUsers[0];
      console.log("User found:", {
        id: userRecord.id,
        email: userRecord.email,
        tenantId: userRecord.tenantId,
        role: userRecord.role,
      });

      // Now query tenant exactly as in AuthService (line 374-377)
      console.log(`\n🔍 DEBUG: Querying tenants table for ID: ${userRecord.tenantId}`);
      console.log(`🔍 DEBUG: Using supabaseAdmin client`);
      
      const { data: tenants, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("id", userRecord.tenantId);
        
      console.log(`🔍 DEBUG: Tenants query result:`, tenants?.length || 0, 'rows');
      console.log(`🔍 DEBUG: Tenants data:`, tenants);
      console.log(`🔍 DEBUG: Tenant error:`, tenantError);
    }

  } catch (error) {
    console.error("❌ Error during debug:", error);
  }
}

debugTenantQuery().catch(console.error);