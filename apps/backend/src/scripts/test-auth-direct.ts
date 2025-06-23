import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { getTenantContext } from '../lib/rls';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDirectAuth() {
  try {
    // 1. Login to get a token
    console.log('\n1. Logging in...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'gcortinez@getsweetspot.io',
      password: '123456'
    });
    
    if (authError || !authData.session) {
      console.error('Login failed:', authError);
      return;
    }
    
    console.log('Login successful, got token');
    const token = authData.session.access_token;
    
    // 2. Test getTenantContext directly
    console.log('\n2. Testing getTenantContext with token...');
    const context = await getTenantContext(token);
    console.log('Tenant context result:', context);
    
    if (!context) {
      console.error('Failed to get tenant context');
      return;
    }
    
    // 3. Get user from database
    console.log('\n3. Getting user from database...');
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      include: { tenant: true }
    });
    
    console.log('User from database:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      tenantId: user?.tenantId,
      status: user?.status,
      tenant: user?.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        status: user.tenant.status
      } : null
    });
    
    // 4. Test the auth flow
    console.log('\n4. Auth flow summary:');
    console.log('- Token is valid: ✅');
    console.log('- User found in DB: ' + (user ? '✅' : '❌'));
    console.log('- User role: ' + (user?.role || 'N/A'));
    console.log('- User is SUPER_ADMIN: ' + (user?.role === 'SUPER_ADMIN' ? '✅' : '❌'));
    console.log('- User tenantId: ' + (user?.tenantId || 'null (expected for super admin)'));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectAuth().catch(console.error);