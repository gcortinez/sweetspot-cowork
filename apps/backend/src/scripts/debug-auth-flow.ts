import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET!;
const API_BASE_URL = 'http://localhost:3001';

console.log('Environment variables loaded:');
console.log('- SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('- SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log('- JWT_SECRET:', JWT_SECRET ? 'Set' : 'Missing');

// Test credentials
const TEST_EMAIL = 'gcortinez@getsweetspot.io';
const TEST_PASSWORD = '123456';

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function log(step: string, message: string, data?: any) {
  console.log(`\n[${step}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testSupabaseConnection() {
  log('CONNECTION', 'Testing Supabase connection...');
  
  try {
    // Test with service role key
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      log('CONNECTION', 'Failed to connect to Supabase', { error });
      return false;
    }
    
    log('CONNECTION', 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    log('CONNECTION', 'Exception while connecting to Supabase', { error });
    return false;
  }
}

async function checkUserInDatabase() {
  log('USER_CHECK', `Checking if user ${TEST_EMAIL} exists in database...`);
  
  try {
    // Check with Prisma
    const user = await prisma.user.findFirst({
      where: { email: TEST_EMAIL },
      include: {
        tenant: true
      }
    });
    
    if (!user) {
      log('USER_CHECK', 'User not found in database');
      return null;
    }
    
    log('USER_CHECK', 'User found in database', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        status: user.tenant.status
      } : null
    });
    
    // Also check with Supabase directly
    const { data: supabaseUser, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (error) {
      log('USER_CHECK', 'Error fetching user from Supabase', { error });
    } else {
      log('USER_CHECK', 'User from Supabase direct query', supabaseUser);
    }
    
    return user;
  } catch (error) {
    log('USER_CHECK', 'Exception while checking user', { error });
    return null;
  }
}

async function testLogin() {
  log('LOGIN', `Attempting to login with ${TEST_EMAIL}...`);
  
  try {
    // Test Supabase Auth login
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (authError) {
      log('LOGIN', 'Supabase Auth login failed', { authError });
      return null;
    }
    
    log('LOGIN', 'Supabase Auth login successful', {
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        role: authData.user?.role,
        app_metadata: authData.user?.app_metadata,
        user_metadata: authData.user?.user_metadata
      },
      session: {
        access_token: authData.session?.access_token ? 'Present' : 'Missing',
        refresh_token: authData.session?.refresh_token ? 'Present' : 'Missing',
        expires_at: authData.session?.expires_at
      }
    });
    
    return authData;
  } catch (error) {
    log('LOGIN', 'Exception during login', { error });
    return null;
  }
}

async function decodeToken(token: string) {
  log('TOKEN', 'Decoding JWT token...');
  
  try {
    // Try to decode without verification first
    const decoded = jwt.decode(token, { complete: true });
    log('TOKEN', 'Token decoded (unverified)', decoded);
    
    // Try to verify with JWT_SECRET
    if (JWT_SECRET) {
      try {
        const verified = jwt.verify(token, JWT_SECRET);
        log('TOKEN', 'Token verified with JWT_SECRET', verified);
      } catch (verifyError) {
        log('TOKEN', 'Failed to verify with JWT_SECRET', { verifyError });
      }
    }
    
    return decoded;
  } catch (error) {
    log('TOKEN', 'Exception while decoding token', { error });
    return null;
  }
}

async function testBackendLogin(token: string) {
  log('BACKEND_LOGIN', 'Testing backend login endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }
    
    log('BACKEND_LOGIN', `Response status: ${response.status}`, {
      headers: response.headers,
      body: responseData
    });
    
    return response.ok ? responseData : null;
  } catch (error) {
    log('BACKEND_LOGIN', 'Exception during backend login', { error });
    return null;
  }
}

async function testSuperAdminEndpoint(token: string) {
  log('SUPER_ADMIN', 'Testing super admin analytics endpoint...');
  
  try {
    // First test the simple test endpoint
    const testResponse = await fetch(`${API_BASE_URL}/api/super-admin/test`, {
      method: 'GET'
    });
    
    const testData = await testResponse.json();
    log('SUPER_ADMIN', 'Test endpoint (no auth):', testData);
    
    // Test auth endpoint
    const authTestResponse = await fetch(`${API_BASE_URL}/api/super-admin/test-auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const authTestData = await authTestResponse.json();
    log('SUPER_ADMIN', 'Test auth endpoint:', authTestData);
    
    // Now test the analytics endpoint
    const response = await fetch(`${API_BASE_URL}/api/super-admin/analytics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }
    
    log('SUPER_ADMIN', `Response status: ${response.status}`, {
      headers: response.headers,
      body: responseData
    });
    
    return response.ok ? responseData : null;
  } catch (error) {
    log('SUPER_ADMIN', 'Exception during super admin endpoint test', { error });
    return null;
  }
}

async function testSupabaseTokenValidation(token: string) {
  log('TOKEN_VALIDATION', 'Testing Supabase token validation...');
  
  try {
    // Test token with admin client (same method used in getTenantContext)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      log('TOKEN_VALIDATION', 'Token validation failed', { error });
      return false;
    }
    
    log('TOKEN_VALIDATION', 'Token validation successful', {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      app_metadata: user?.app_metadata,
      user_metadata: user?.user_metadata
    });
    
    return true;
  } catch (error) {
    log('TOKEN_VALIDATION', 'Exception during token validation', { error });
    return false;
  }
}

async function testAuthMiddleware(token: string) {
  log('AUTH_MIDDLEWARE', 'Testing auth middleware directly...');
  
  try {
    // Test a simple authenticated endpoint
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }
    
    log('AUTH_MIDDLEWARE', `Response status: ${response.status}`, {
      headers: response.headers,
      body: responseData
    });
    
    return response.ok ? responseData : null;
  } catch (error) {
    log('AUTH_MIDDLEWARE', 'Exception during auth middleware test', { error });
    return null;
  }
}

async function checkRLSPolicies(userId: string) {
  log('RLS', 'Checking RLS policies...');
  
  try {
    // Test if we can query users with RLS
    const { data: rlsData, error: rlsError } = await supabaseAnon
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (rlsError) {
      log('RLS', 'RLS query failed (expected if policies are enforced)', { rlsError });
    } else {
      log('RLS', 'RLS query succeeded', { recordCount: rlsData?.length || 0 });
    }
    
    // Test with service role (bypasses RLS)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (adminError) {
      log('RLS', 'Admin query failed', { adminError });
    } else {
      log('RLS', 'Admin query succeeded (bypasses RLS)', { recordCount: adminData?.length || 0 });
    }
  } catch (error) {
    log('RLS', 'Exception while checking RLS', { error });
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('AUTHENTICATION FLOW DEBUG SCRIPT');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Test Supabase connection
    const connected = await testSupabaseConnection();
    if (!connected) {
      console.error('\nFailed to connect to Supabase. Check your environment variables.');
      process.exit(1);
    }
    
    // Step 2: Check if user exists in database
    const dbUser = await checkUserInDatabase();
    if (!dbUser) {
      console.error('\nUser not found in database. Run create-super-admin script first.');
      process.exit(1);
    }
    
    // Step 3: Test login
    const authData = await testLogin();
    if (!authData || !authData.session) {
      console.error('\nLogin failed. Check user credentials and Supabase Auth configuration.');
      process.exit(1);
    }
    
    const token = authData.session.access_token;
    
    // Step 4: Decode token
    await decodeToken(token);
    
    // Step 5: Test Supabase token validation
    const tokenValid = await testSupabaseTokenValidation(token);
    if (!tokenValid) {
      console.error('\nSupabase token validation failed. This is why authentication is failing.');
    }
    
    // Step 6: Test backend login
    await testBackendLogin(token);
    
    // Step 7: Test auth middleware
    await testAuthMiddleware(token);
    
    // Step 8: Test super admin endpoint
    await testSuperAdminEndpoint(token);
    
    // Step 9: Check RLS policies
    if (authData.user) {
      await checkRLSPolicies(authData.user.id);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\nUnexpected error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);