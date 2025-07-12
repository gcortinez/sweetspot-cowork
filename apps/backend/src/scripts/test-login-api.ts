import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const API_URL = "http://localhost:3001"; // Backend API URL

async function testLogin() {
  const email = "gcortinez@gmail.com";
  const password = "testing123"; // You'll need to provide the correct password

  console.log("🔍 Testing login API");
  console.log("Email:", email);
  console.log("API URL:", API_URL);
  console.log("================================================================================");

  try {
    // Test login without tenant slug
    console.log("\n1️⃣ Testing login without tenant slug:");
    const response1 = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    }, {
      validateStatus: () => true, // Accept any status code
    });

    console.log("Response status:", response1.status);
    console.log("Response data:", JSON.stringify(response1.data, null, 2));

    // Test login with tenant slug
    if (response1.data.tenants && response1.data.tenants.length > 0) {
      const tenantSlug = response1.data.tenants[0].slug;
      console.log(`\n2️⃣ Testing login with tenant slug: ${tenantSlug}`);
      
      const response2 = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        tenantSlug,
      }, {
        validateStatus: () => true,
      });

      console.log("Response status:", response2.status);
      console.log("Response data:", JSON.stringify(response2.data, null, 2));
    }

  } catch (error: any) {
    console.error("❌ Error during login test:");
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

// Run the test
console.log("⚠️  Make sure the backend server is running on port 3001");
console.log("⚠️  You may need to update the password in the script");
console.log("");

testLogin().catch(console.error);