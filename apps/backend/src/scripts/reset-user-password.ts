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

async function resetUserPassword() {
  const email = "gcortinez@gmail.com";
  const newPassword = "testing123";

  console.log("🔍 Resetting password for user:", email);
  console.log("================================================================================");

  try {
    // 1. Find user in database
    console.log("\n1️⃣ Finding user in database:");
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, supabaseId")
      .eq("email", email);

    if (userError || !users || users.length === 0) {
      console.error("❌ User not found:", userError?.message);
      return;
    }

    const user = users[0];
    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      supabaseId: user.supabaseId,
    });

    // 2. Update password in Supabase Auth
    console.log("\n2️⃣ Updating password in Supabase Auth:");
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.supabaseId,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error("❌ Failed to update password:", updateError.message);
      return;
    }

    console.log("✅ Password updated successfully!");
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);

    // 3. Test login
    console.log("\n3️⃣ Testing login with new password:");
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (authError) {
      console.error("❌ Login test failed:", authError.message);
    } else {
      console.log("✅ Login test successful!");
      console.log("Session expires at:", new Date(authData.session!.expires_at! * 1000).toISOString());
    }

  } catch (error) {
    console.error("❌ Error during password reset:", error);
  }
}

resetUserPassword().catch(console.error);