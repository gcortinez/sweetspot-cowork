import express from "express";
import { config } from "dotenv";
import { resolve } from "path";
import { authenticate } from "../middleware/auth";
import { requireSuperAdmin } from "../middleware/permissions";
import { AuthService } from "../services/authService";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

const app = express();
app.use(express.json());

// Test endpoint that mimics the super admin analytics
app.get("/test-auth", authenticate as any, requireSuperAdmin as any, (req: any, res) => {
  res.json({
    success: true,
    message: "Super Admin authentication works!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for login
app.post("/test-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Login failed"
    });
  }
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`\n🧪 Test server running on http://localhost:${PORT}`);
  console.log("Testing authentication flow...\n");
  
  // Automatically test the authentication
  testAuthentication();
});

async function testAuthentication() {
  try {
    console.log("1️⃣ Testing login...");
    
    // Login
    const loginResponse = await fetch(`http://localhost:${PORT}/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "gcortinez@getsweetspot.io",
        password: "123456"
      })
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (!loginData.success) {
      console.error("❌ Login failed:", loginData.error);
      return;
    }
    
    console.log("✅ Login successful");
    console.log("   User:", loginData.user.email, loginData.user.role);
    
    // Test authenticated endpoint
    console.log("\n2️⃣ Testing authenticated endpoint...");
    
    const authResponse = await fetch(`http://localhost:${PORT}/test-auth`, {
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const authData = await authResponse.json() as any;
    
    if (authResponse.ok && authData.success) {
      console.log("✅ Authentication works!");
      console.log("   Authenticated user:", authData.user?.email, authData.user?.role);
      console.log("\n🎉 SUPER ADMIN AUTHENTICATION IS FULLY WORKING!");
    } else {
      console.error("❌ Authentication failed:", authData);
    }
    
  } catch (error) {
    console.error("💥 Test failed:", error);
  } finally {
    setTimeout(() => {
      console.log("\n✨ Test completed. Server will remain running for manual testing.");
      console.log(`Visit: http://localhost:${PORT}/test-login to test login`);
      console.log(`Visit: http://localhost:${PORT}/test-auth with Bearer token to test auth`);
    }, 1000);
  }
}