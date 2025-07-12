import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

const API_URL = "http://localhost:3001";

async function testLogin() {
  console.log("🔐 Testing login functionality");
  console.log("==============================\n");

  const testCases = [
    {
      name: "Valid login (if user exists)",
      email: "admin@sweetspot.io",
      password: "test123", // Replace with actual password
      expectedSuccess: true,
    },
    {
      name: "Invalid password",
      email: "admin@sweetspot.io",
      password: "wrongpassword",
      expectedSuccess: false,
    },
    {
      name: "Non-existent user",
      email: "nonexistent@example.com",
      password: "password123",
      expectedSuccess: false,
    },
  ];

  // First check if backend is running
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      console.error("❌ Backend is not running on port 3001");
      console.log("Please start the backend with: npm run dev");
      return;
    }
    console.log("✅ Backend is running\n");
  } catch (error) {
    console.error("❌ Cannot connect to backend on port 3001");
    console.log("Please start the backend with: npm run dev");
    return;
  }

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Email: ${testCase.email}`);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testCase.email,
          password: testCase.password,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`   ✅ Login successful`);
        console.log(`   User: ${data.user?.email}`);
        console.log(`   Tenant: ${data.tenant?.name}`);
      } else {
        console.log(`   ❌ Login failed`);
        console.log(`   Error: ${data.error}`);
      }
      
      console.log(`   Status: ${response.status}`);
      console.log("");
    } catch (error) {
      console.error(`   ❌ Request failed:`, error);
      console.log("");
    }
  }
}

// Run the test
testLogin().catch(console.error);