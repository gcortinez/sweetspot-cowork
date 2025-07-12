import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

const API_URL = process.env.API_URL || "http://localhost:3001";

interface TestCase {
  name: string;
  data: {
    email: string;
    password: string;
    tenantSlug?: string;
  };
  expectedError?: string;
}

const testCases: TestCase[] = [
  {
    name: "Invalid email format",
    data: {
      email: "notanemail",
      password: "password123",
    },
    expectedError: "Invalid email format",
  },
  {
    name: "Wrong password",
    data: {
      email: "test@example.com",
      password: "wrongpassword",
    },
    expectedError: "Invalid email or password",
  },
  {
    name: "Non-existent user",
    data: {
      email: "nonexistent@example.com",
      password: "password123",
    },
    expectedError: "Invalid email or password",
  },
  {
    name: "Invalid tenant slug",
    data: {
      email: "test@example.com",
      password: "password123",
      tenantSlug: "nonexistent-tenant",
    },
    expectedError: "Tenant with slug 'nonexistent-tenant' not found",
  },
  {
    name: "User not in specified tenant",
    data: {
      email: "test@example.com",
      password: "password123",
      tenantSlug: "different-tenant",
    },
    expectedError: "User not found in this workspace",
  },
];

async function testLogin(testCase: TestCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Data: ${JSON.stringify(testCase.data)}`);

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCase.data),
    });

    const data = await response.json() as any;
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);

    if (!response.ok || !data.success) {
      const error = data.error || data.message || "Unknown error";
      console.log(`   ❌ Error received: "${error}"`);
      
      if (testCase.expectedError && error.includes(testCase.expectedError)) {
        console.log(`   ✅ Expected error received`);
      } else if (testCase.expectedError) {
        console.log(`   ⚠️  Expected: "${testCase.expectedError}"`);
      }
    } else {
      console.log(`   ✅ Login successful (unexpected)`);
    }
  } catch (error) {
    console.error(`   ❌ Network error:`, error);
  }
}

async function runTests() {
  console.log("🔍 Testing Login Error Messages");
  console.log("================================");

  for (const testCase of testCases) {
    await testLogin(testCase);
  }

  console.log("\n✅ All tests completed");
}

// Run tests
runTests().catch(console.error);