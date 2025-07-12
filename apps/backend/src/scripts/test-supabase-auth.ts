import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

async function testSupabaseAuth() {
  console.log("🔍 Testing Supabase Authentication Configuration");
  console.log("================================================");
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("\n📋 Environment Variables:");
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("\n❌ Missing required environment variables!");
    process.exit(1);
  }
  
  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    console.log(`\n🌐 Supabase URL validation:`);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Valid URL: ✅`);
    
    // Check if it's a valid Supabase URL
    if (!url.hostname.includes('supabase.co')) {
      console.warn(`   ⚠️  Warning: URL doesn't appear to be a Supabase URL`);
    }
  } catch (error) {
    console.error(`\n❌ Invalid SUPABASE_URL format:`, error);
    process.exit(1);
  }
  
  // Test connection to Supabase
  console.log("\n🔌 Testing connection to Supabase...");
  
  try {
    // Test with fetch to the auth endpoint
    const authUrl = `${supabaseUrl}/auth/v1/health`;
    console.log(`   Testing: ${authUrl}`);
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('text/html')) {
      console.error(`\n❌ Receiving HTML instead of JSON!`);
      console.error(`   This usually means:`);
      console.error(`   1. The SUPABASE_URL is incorrect`);
      console.error(`   2. There's a network/proxy issue`);
      console.error(`   3. The Supabase project is paused or deleted`);
      
      const text = await response.text();
      console.error(`\n   First 500 chars of response:`);
      console.error(`   ${text.substring(0, 500)}...`);
    } else {
      const data = await response.json();
      console.log(`   Response data:`, data);
      console.log(`\n✅ Supabase connection successful!`);
    }
  } catch (error) {
    console.error(`\n❌ Failed to connect to Supabase:`, error);
  }
  
  // Test auth endpoint directly
  console.log("\n🔐 Testing auth endpoint directly...");
  try {
    const signInUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    console.log(`   Testing: ${signInUrl}`);
    
    const response = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    console.log(`   Response status: ${response.status}`);
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('text/html')) {
      console.error(`\n❌ Auth endpoint returning HTML!`);
      const text = await response.text();
      console.error(`   First 500 chars:`, text.substring(0, 500));
    } else {
      const data = await response.json();
      console.log(`   Response:`, data);
    }
  } catch (error) {
    console.error(`\n❌ Auth endpoint test failed:`, error);
  }
}

// Run the test
testSupabaseAuth().catch(console.error);