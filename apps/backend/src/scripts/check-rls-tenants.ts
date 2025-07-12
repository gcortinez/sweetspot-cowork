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

async function checkRLSTenants() {
  console.log("🔍 Checking RLS status on tenants table");
  console.log("================================================================================");

  try {
    // 1. Check if RLS is enabled
    console.log("\n1️⃣ Checking RLS status:");
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('query', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE tablename = 'tenants' 
          AND schemaname = 'public';
        `
      });

    if (rlsError) {
      console.log("Cannot check RLS status directly");
    } else {
      console.log("RLS Status:", rlsStatus);
    }

    // 2. Try to query tenants with service role
    console.log("\n2️⃣ Querying tenants with service role key:");
    const { data: tenants1, error: error1 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .limit(5);

    console.log("Result:", {
      count: tenants1?.length || 0,
      error: error1?.message,
      data: tenants1?.map(t => ({ id: t.id, name: t.name })),
    });

    // 3. Check RLS policies
    console.log("\n3️⃣ Checking RLS policies on tenants table:");
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('query', {
        query: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'tenants' 
          AND schemaname = 'public';
        `
      });

    if (policiesError) {
      console.log("Cannot check policies directly");
    } else {
      console.log("Policies:", policies);
    }

    // 4. Try raw SQL query
    console.log("\n4️⃣ Testing with RPC to bypass RLS:");
    
    // First, let's create a simple RPC function that bypasses RLS
    const createRpcSql = `
      CREATE OR REPLACE FUNCTION debug_get_all_tenants()
      RETURNS TABLE(
        id TEXT,
        name TEXT,
        status TEXT,
        count BIGINT
      )
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT 
          id,
          name,
          status,
          COUNT(*) OVER() as count
        FROM tenants
        LIMIT 10;
      $$;
    `;

    console.log("\n📝 SQL to create debug RPC function:");
    console.log(createRpcSql);
    console.log("\n⚠️  Please run this SQL in your Supabase SQL editor, then test again.");

    // 5. Check if we can at least count
    console.log("\n5️⃣ Trying to count tenants:");
    const { count, error: countError } = await supabaseAdmin
      .from("tenants")
      .select("*", { count: "exact", head: true });

    console.log("Count result:", {
      count,
      error: countError?.message,
    });

  } catch (error) {
    console.error("❌ Error during RLS check:", error);
  }
}

checkRLSTenants().catch(console.error);