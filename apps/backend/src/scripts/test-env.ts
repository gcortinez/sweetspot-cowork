import dotenv from "dotenv";
import { join } from "path";

console.log("🔍 Testing Environment Variable Loading");
console.log("=".repeat(50));

// Test different dotenv configurations
console.log("📁 Current working directory:", process.cwd());

// Try loading from different paths
const envPaths = [
  ".env.local",
  ".env",
  join(process.cwd(), ".env.local"),
  join(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
  console.log(`\n📋 Trying to load: ${envPath}`);
  try {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.log(`❌ Error: ${result.error.message}`);
    } else {
      console.log(`✅ Loaded successfully`);
      console.log(
        `📊 Parsed ${Object.keys(result.parsed || {}).length} variables`
      );
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
}

console.log("\n🔍 Current environment variables:");
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

if (process.env.SUPABASE_URL) {
  console.log(`📍 SUPABASE_URL: ${process.env.SUPABASE_URL}`);
}

// Test importing the supabase client
async function testSupabaseClient() {
  console.log("\n🔗 Testing Supabase client import...");
  try {
    const { supabaseAdmin } = await import("../lib/supabase.js");
    console.log("✅ Supabase client imported successfully");

    // Test a simple query
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("count")
      .limit(1);
    if (error) {
      console.log(`❌ Query failed: ${error.message}`);
    } else {
      console.log("✅ Query successful");
    }
  } catch (error) {
    console.log(`❌ Import failed: ${error}`);
  }
}

testSupabaseClient();
