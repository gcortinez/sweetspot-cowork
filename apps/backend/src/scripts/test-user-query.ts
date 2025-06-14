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

async function testUserQuery() {
  const email = "gcortinez@getsweetspot.io";

  console.log("🔍 Testing user query for:", email);
  console.log(
    "📊 Using service role key:",
    supabaseServiceKey.substring(0, 20) + "..."
  );

  // Test 1: Direct query
  console.log("\n1️⃣ Testing direct query:");
  const { data: users1, error: error1 } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email);

  console.log("Result:", {
    count: users1?.length || 0,
    error: error1?.message,
  });
  if (users1 && users1.length > 0) {
    console.log("User found:", users1[0]);
  }

  // Test 2: Query with status filter
  console.log("\n2️⃣ Testing with status filter:");
  const { data: users2, error: error2 } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("status", "ACTIVE");

  console.log("Result:", {
    count: users2?.length || 0,
    error: error2?.message,
  });

  // Test 3: Query all users to see if table is accessible
  console.log("\n3️⃣ Testing table access (first 5 users):");
  const { data: allUsers, error: error3 } = await supabaseAdmin
    .from("users")
    .select("id, email, status")
    .limit(5);

  console.log("Result:", {
    count: allUsers?.length || 0,
    error: error3?.message,
  });
  if (allUsers) {
    allUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.status})`);
    });
  }

  // Test 4: Check if we're using the right table name
  console.log("\n4️⃣ Testing table names:");
  const { data: tables, error: error4 } = await supabaseAdmin
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .like("table_name", "%user%");

  console.log(
    "Tables with 'user' in name:",
    tables?.map((t) => t.table_name) || []
  );
}

testUserQuery().catch(console.error);
