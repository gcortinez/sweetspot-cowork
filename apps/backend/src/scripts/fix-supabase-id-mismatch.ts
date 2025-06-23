import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function fixSupabaseIdMismatch() {
  try {
    console.log("🔧 Fixing Supabase ID Mismatch...\n");

    // Step 1: Get all users from our database
    console.log("1️⃣ Getting all users from database...");
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "gcortinez@getsweetspot.io");

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return;
    }

    console.log(`Found ${allUsers?.length || 0} users with email gcortinez@getsweetspot.io`);
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`     - ID: ${user.id}`);
        console.log(`     - Email: ${user.email}`);
        console.log(`     - Role: ${user.role}`);
        console.log(`     - TenantId: ${user.tenantId}`);
        console.log(`     - SupabaseId: ${user.supabaseId}`);
        console.log(`     - Status: ${user.status}`);
      });
    }

    // Step 2: Get the Supabase Auth user
    console.log("\n2️⃣ Getting Supabase Auth users...");
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const targetAuthUser = authUsers.users.find(u => u.email === "gcortinez@getsweetspot.io");
    if (!targetAuthUser) {
      console.error("❌ No Supabase Auth user found with email gcortinez@getsweetspot.io");
      return;
    }

    console.log("✅ Found Supabase Auth user:");
    console.log(`   - ID: ${targetAuthUser.id}`);
    console.log(`   - Email: ${targetAuthUser.email}`);
    console.log(`   - Created: ${targetAuthUser.created_at}`);

    // Step 3: Check if IDs match
    if (allUsers && allUsers.length > 0) {
      const dbUser = allUsers[0];
      console.log("\n3️⃣ Comparing IDs...");
      console.log(`   Database SupabaseId: ${dbUser.supabaseId}`);
      console.log(`   Auth User ID: ${targetAuthUser.id}`);
      
      if (dbUser.supabaseId === targetAuthUser.id) {
        console.log("✅ IDs match! The problem is elsewhere.");
        
        // Test the exact query that's failing
        console.log("\n4️⃣ Testing the exact failing query...");
        const { data: testQuery, error: testError } = await supabaseAdmin
          .from("users")
          .select("id, tenantId, role, clientId")
          .eq("supabaseId", targetAuthUser.id);

        if (testError) {
          console.error("❌ Test query failed:", testError);
        } else {
          console.log("✅ Test query succeeded:", testQuery);
        }
      } else {
        console.log("❌ IDs DO NOT MATCH! Fixing...");
        
        // Update the database record with the correct supabaseId
        const { data: updateResult, error: updateError } = await supabaseAdmin
          .from("users")
          .update({ supabaseId: targetAuthUser.id })
          .eq("id", dbUser.id)
          .select();

        if (updateError) {
          console.error("❌ Failed to update supabaseId:", updateError);
        } else {
          console.log("✅ Successfully updated supabaseId!");
          console.log("Updated user:", updateResult);
          
          // Test authentication again
          console.log("\n5️⃣ Testing authentication after fix...");
          const { data: testQuery, error: testError } = await supabaseAdmin
            .from("users")
            .select("id, tenantId, role, clientId")
            .eq("supabaseId", targetAuthUser.id);

          if (testError) {
            console.error("❌ Test query still failed:", testError);
          } else {
            console.log("✅ Test query now succeeds:", testQuery);
          }
        }
      }
    }

    // Step 4: Also check for any orphaned auth users
    console.log("\n6️⃣ Checking for orphaned auth users...");
    const authUserEmails = authUsers.users.map(u => u.email);
    console.log(`Found ${authUsers.users.length} total auth users`);
    
    // Check if there are multiple auth users with similar emails
    const similarUsers = authUsers.users.filter(u => 
      u.email?.includes("gcortinez") || u.email?.includes("getsweetspot")
    );
    
    if (similarUsers.length > 1) {
      console.log("⚠️ Found multiple similar auth users:");
      similarUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error("💥 Script failed:", error);
  }
}

// Run the fix
fixSupabaseIdMismatch()
  .then(() => {
    console.log("\n✨ Fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  });