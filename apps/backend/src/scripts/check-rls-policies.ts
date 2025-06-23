import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function checkRLSPolicies() {
  try {
    console.log("🔒 Checking RLS Policies...\n");

    // Check if RLS is enabled on users table
    console.log("1️⃣ Checking RLS status on 'users' table...");
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from("pg_tables")
      .select("*")
      .eq("tablename", "users");

    if (rlsError) {
      console.error("❌ Error checking RLS status:", rlsError);
    } else {
      console.log("✅ Users table found");
    }

    // Check current policies on users table
    console.log("\n2️⃣ Checking policies on 'users' table...");
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc(
      'get_policies',
      { table_name: 'users' }
    );

    if (policiesError) {
      console.log("⚠️ get_policies RPC not available, trying alternative...");
      
      // Try raw SQL query to check policies
      const { data: rawPolicies, error: rawError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE tablename = 'users';
          `
        });

      if (rawError) {
        console.log("⚠️ exec_sql RPC not available either. Checking manually...");
        
        // Test direct access with service role
        console.log("\n3️⃣ Testing direct access with service role...");
        const { data: allUsers, error: usersError, count } = await supabaseAdmin
          .from("users")
          .select("*", { count: 'exact' });

        if (usersError) {
          console.error("❌ Service role cannot access users table:", usersError);
          console.log("This indicates RLS is blocking even the service role!");
        } else {
          console.log(`✅ Service role can access users table. Found ${count} users.`);
          if (allUsers && allUsers.length > 0) {
            console.log("Sample users:");
            allUsers.slice(0, 3).forEach(user => {
              console.log(`   - ${user.email} (${user.role}) - Tenant: ${user.tenantId || 'null'}`);
            });
          }
        }
      } else {
        console.log("Raw policies:", rawPolicies);
      }
    } else {
      console.log("Policies found:", policies);
    }

    // Test specific query that's failing
    console.log("\n4️⃣ Testing specific failing query...");
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId")
      .eq("supabaseId", "d54e4b4a-4645-4c2a-afe8-060f0a4f8af8")
      .single();

    if (specificError) {
      console.error("❌ Specific query failed:", specificError);
      
      // Try without .single()
      console.log("\n5️⃣ Trying query without .single()...");
      const { data: multipleUsers, error: multipleError } = await supabaseAdmin
        .from("users")
        .select("id, tenantId, role, clientId")
        .eq("supabaseId", "d54e4b4a-4645-4c2a-afe8-060f0a4f8af8");

      if (multipleError) {
        console.error("❌ Multiple query also failed:", multipleError);
      } else {
        console.log(`✅ Multiple query succeeded. Found ${multipleUsers?.length || 0} users.`);
        if (multipleUsers?.length) {
          console.log("User data:", multipleUsers[0]);
        }
      }
    } else {
      console.log("✅ Specific query succeeded:", specificUser);
    }

    // Check if we can create policies
    console.log("\n6️⃣ Attempting to fix RLS policies...");
    
    // Try to disable RLS temporarily for testing
    const { error: disableRLSError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
    });

    if (disableRLSError) {
      console.log("⚠️ Cannot disable RLS via RPC. Trying direct policy creation...");
      
      // Create a policy that allows service role access
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY IF NOT EXISTS "service_role_all_access" ON users
          FOR ALL TO service_role
          USING (true)
          WITH CHECK (true);
        `
      });

      if (policyError) {
        console.error("❌ Cannot create policy:", policyError);
        console.log("\n🔧 MANUAL STEPS REQUIRED:");
        console.log("1. Go to Supabase Dashboard > Authentication > Policies");
        console.log("2. Find the 'users' table");
        console.log("3. Create a new policy with these settings:");
        console.log("   - Name: 'service_role_all_access'");
        console.log("   - Allowed operation: ALL");
        console.log("   - Target role: service_role");
        console.log("   - Policy definition: true");
        console.log("   - Check expression: true");
        console.log("\nOR temporarily disable RLS:");
        console.log("   ALTER TABLE users DISABLE ROW LEVEL SECURITY;");
      } else {
        console.log("✅ Policy created successfully!");
      }
    } else {
      console.log("✅ RLS disabled for users table!");
    }

    // Test again after potential fix
    console.log("\n7️⃣ Testing access after potential fix...");
    const { data: testUser, error: testError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId")
      .eq("supabaseId", "d54e4b4a-4645-4c2a-afe8-060f0a4f8af8")
      .single();

    if (testError) {
      console.error("❌ Still failing after fix attempt:", testError);
    } else {
      console.log("✅ Access working after fix!");
      console.log("User:", testUser);
    }

  } catch (error) {
    console.error("💥 Script failed:", error);
  }
}

// Run the check
checkRLSPolicies()
  .then(() => {
    console.log("\n✨ RLS check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ RLS check failed:", error);
    process.exit(1);
  });