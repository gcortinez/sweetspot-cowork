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

async function createTenantRPC() {
  console.log("🔍 Creating RPC function to get tenant by ID");
  console.log("================================================================================");

  const sql = `
    CREATE OR REPLACE FUNCTION get_tenant_by_id(tenant_id TEXT)
    RETURNS TABLE(
      id TEXT,
      name TEXT,
      slug TEXT,
      domain TEXT,
      logo TEXT,
      description TEXT,
      settings JSONB,
      status TEXT,
      "createdAt" TIMESTAMP,
      "updatedAt" TIMESTAMP
    )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT 
        id,
        name,
        slug,
        domain,
        logo,
        description,
        settings,
        status,
        "createdAt",
        "updatedAt"
      FROM tenants
      WHERE id = tenant_id
      LIMIT 1;
    $$;
  `;

  try {
    console.log("Creating RPC function...");
    const { error } = await supabaseAdmin.rpc('query', {
      query: sql
    }).single();

    if (error) {
      // Try direct SQL execution
      console.log("Direct RPC creation failed, trying alternative method...");
      
      // Create via Supabase SQL editor or use a different approach
      console.log("\n📝 SQL to create the function:");
      console.log(sql);
      console.log("\n⚠️  Please run this SQL in your Supabase SQL editor to create the function.");
    } else {
      console.log("✅ RPC function created successfully!");
    }

    // Test the function if it exists
    console.log("\n🔍 Testing RPC function:");
    const { data, error: testError } = await supabaseAdmin.rpc('get_tenant_by_id', {
      tenant_id: 'cmc4e452q0000e6c2roj7mmpg'
    });

    if (testError) {
      console.log("❌ Test failed:", testError.message);
    } else {
      console.log("✅ Test successful:", data);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

createTenantRPC().catch(console.error);