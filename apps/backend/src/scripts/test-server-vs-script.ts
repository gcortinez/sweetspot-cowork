import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";
import { getTenantContext } from "../lib/rls";
import { AuthService } from "../services/authService";

// Load environment variables - exactly like the server does
config({ path: resolve(__dirname, "../../.env") });

async function testServerVsScript() {
  try {
    console.log("🔬 Testing Server vs Script Environment Differences...\n");

    // Print environment variables (without revealing sensitive keys)
    console.log("1️⃣ Environment Variables Check:");
    console.log("   SUPABASE_URL:", process.env.SUPABASE_URL?.substring(0, 30) + "...");
    console.log("   SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "[SET]" : "[NOT SET]");
    console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "[SET]" : "[NOT SET]");
    console.log("   NODE_ENV:", process.env.NODE_ENV);

    // Test the exact same flow the server uses
    console.log("\n2️⃣ Testing exact server authentication flow...");
    
    // Login to get token (this works)
    const loginResult = await AuthService.login("gcortinez@getsweetspot.io", "123456");
    if (!loginResult.success || !loginResult.accessToken) {
      console.error("❌ Login failed:", loginResult.error);
      return;
    }
    
    const token = loginResult.accessToken;
    console.log("✅ Login successful, token:", token.substring(0, 50) + "...");

    // Test the exact middleware flow
    console.log("\n3️⃣ Testing middleware authentication flow...");
    
    // Step 1: Validate Authorization header format
    const authHeader = `Bearer ${token}`;
    if (!authHeader.startsWith("Bearer ")) {
      console.error("❌ Invalid auth header format");
      return;
    }
    console.log("✅ Auth header format valid");

    // Step 2: Extract token
    const extractedToken = authHeader.substring(7);
    console.log("✅ Token extracted");

    // Step 3: Call AuthService.getSession (this is what fails in middleware)
    console.log("\n4️⃣ Calling AuthService.getSession...");
    const session = await AuthService.getSession(extractedToken);
    
    if (!session.isValid) {
      console.error("❌ getSession failed - session invalid");
      console.log("Session data:", session);
      
      // Debug the getTenantContext call specifically
      console.log("\n5️⃣ Debugging getTenantContext directly...");
      const context = await getTenantContext(extractedToken);
      console.log("getTenantContext result:", context);
      
      return;
    }
    
    console.log("✅ getSession successful");
    console.log("   User:", session.user?.email, session.user?.role);
    console.log("   Tenant:", session.tenant?.name || 'null (super admin)');

    // Test direct Supabase client configuration
    console.log("\n6️⃣ Testing Supabase client configuration...");
    
    // Check if we can get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(extractedToken);
    if (userError || !user) {
      console.error("❌ Supabase getUser failed:", userError);
      return;
    }
    console.log("✅ Supabase getUser successful:", user.email);

    // Check if we can query users table directly
    console.log("\n7️⃣ Testing direct users table query...");
    const { data: userRecord, error: queryError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId")
      .eq("supabaseId", user.id)
      .single();

    if (queryError) {
      console.error("❌ Direct query failed:", queryError);
      
      // Try different query approaches
      console.log("\n8️⃣ Trying alternative query approaches...");
      
      // Try without .single()
      const { data: multipleUsers, error: multipleError } = await supabaseAdmin
        .from("users")
        .select("id, tenantId, role, clientId")
        .eq("supabaseId", user.id);

      if (multipleError) {
        console.error("❌ Multiple query also failed:", multipleError);
      } else {
        console.log(`✅ Multiple query succeeded: ${multipleUsers?.length || 0} users found`);
        if (multipleUsers && multipleUsers.length > 0) {
          console.log("User data:", multipleUsers[0]);
        }
      }

      // Try with different client configuration
      console.log("\n9️⃣ Testing with different client configurations...");
      
      // Create a fresh client
      const { createClient } = await import("@supabase/supabase-js");
      const freshClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: freshUserRecord, error: freshError } = await freshClient
        .from("users")
        .select("id, tenantId, role, clientId")
        .eq("supabaseId", user.id)
        .single();

      if (freshError) {
        console.error("❌ Fresh client also failed:", freshError);
      } else {
        console.log("✅ Fresh client succeeded:", freshUserRecord);
      }

      return;
    }
    
    console.log("✅ Direct query successful:", userRecord);

    console.log("\n🎉 All tests passed! The issue must be in the server runtime environment.");

  } catch (error) {
    console.error("💥 Test failed with error:", error);
  }
}

// Run the test
testServerVsScript()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });