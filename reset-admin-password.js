const { config } = require("dotenv");
const { resolve } = require("path");
const { supabaseAdmin } = require("./src/lib/supabase");

// Load environment variables
config({ path: resolve(__dirname, ".env") });

async function resetAdminPassword() {
  try {
    console.log("🔄 Resetting admin password...");

    // Reset password for admin@sweetspot.io
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      "user_1749874837193", // User ID from previous output
      {
        password: "admin123",
      }
    );

    if (error) {
      console.error("❌ Error resetting password:", error);
      return;
    }

    console.log("✅ Password reset successfully!");
    console.log("📧 Email: admin@sweetspot.io");
    console.log("🔑 Password: admin123");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

resetAdminPassword().then(() => process.exit(0));