import { config } from "dotenv";
import { resolve } from "path";
import { supabaseAdmin } from "../lib/supabase";
import { getTenantContext } from "../lib/rls";
import { AuthService } from "../services/authService";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function testMiddlewareAuth() {
  try {
    console.log("🧪 Testing Middleware Authentication Flow...\n");

    // Step 1: Test login to get token
    console.log("1️⃣ Testing login...");
    const loginResult = await AuthService.login("gcortinez@getsweetspot.io", "123456");
    
    if (!loginResult.success || !loginResult.accessToken) {
      console.error("❌ Login failed:", loginResult.error);
      return;
    }
    
    console.log("✅ Login successful");
    console.log("   Token:", loginResult.accessToken?.substring(0, 50) + "...");
    console.log("   User:", loginResult.user?.email, loginResult.user?.role);
    
    const token = loginResult.accessToken;

    // Step 2: Test token validation with Supabase
    console.log("\n2️⃣ Testing Supabase token validation...");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("❌ Token validation failed:", userError);
      return;
    }
    
    console.log("✅ Token validation successful");
    console.log("   Supabase User ID:", user.id);
    console.log("   Email:", user.email);

    // Step 3: Test direct user query (what getTenantContext does)
    console.log("\n3️⃣ Testing direct user query...");
    const { data: userRecord, error: queryError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId")
      .eq("supabaseId", user.id)
      .single();

    if (queryError) {
      console.error("❌ User query failed:", queryError);
      console.log("   Error code:", queryError.code);
      console.log("   Error details:", queryError.details);
      console.log("   Error hint:", queryError.hint);
      console.log("   Error message:", queryError.message);
      
      // Try to find all users with this email
      console.log("\n🔍 Looking for users with email...");
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", "gcortinez@getsweetspot.io");
        
      console.log("All users found:", allUsers?.length || 0);
      if (allUsers?.length) {
        allUsers.forEach(u => {
          console.log(`   User: ${u.email}, SupabaseId: ${u.supabaseId}, Role: ${u.role}, TenantId: ${u.tenantId}`);
        });
      }
      
      return;
    }
    
    console.log("✅ User query successful");
    console.log("   User Record:", {
      id: userRecord.id,
      tenantId: userRecord.tenantId,
      role: userRecord.role,
      clientId: userRecord.clientId
    });

    // Step 4: Test getTenantContext function
    console.log("\n4️⃣ Testing getTenantContext function...");
    const tenantContext = await getTenantContext(token);
    
    if (!tenantContext) {
      console.error("❌ getTenantContext failed");
      return;
    }
    
    console.log("✅ getTenantContext successful");
    console.log("   Context:", tenantContext);

    // Step 5: Test AuthService.getSession (what middleware uses)
    console.log("\n5️⃣ Testing AuthService.getSession...");
    const session = await AuthService.getSession(token);
    
    if (!session.isValid) {
      console.error("❌ getSession failed - session invalid");
      return;
    }
    
    console.log("✅ getSession successful");
    console.log("   Session valid:", session.isValid);
    console.log("   User:", session.user?.email, session.user?.role);
    console.log("   Tenant:", session.tenant?.name || 'null (super admin)');

    // Step 6: Test direct API call simulation
    console.log("\n6️⃣ Simulating middleware authentication...");
    
    // This is what the authenticate middleware does
    const authHeader = `Bearer ${token}`;
    if (!authHeader.startsWith("Bearer ")) {
      console.error("❌ Invalid auth header format");
      return;
    }

    const extractedToken = authHeader.substring(7);
    const middlewareSession = await AuthService.getSession(extractedToken);
    
    if (!middlewareSession.isValid) {
      console.error("❌ Middleware authentication failed");
      console.log("   Session:", middlewareSession);
      return;
    }
    
    console.log("✅ Middleware authentication successful");
    console.log("   User authenticated as:", middlewareSession.user?.email);

    console.log("\n🎉 All authentication tests passed!");
    console.log("The issue might be elsewhere in the middleware chain or server configuration.");

  } catch (error) {
    console.error("💥 Test failed with error:", error);
  }
}

// Run the test
testMiddlewareAuth()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });