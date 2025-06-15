import { supabaseAdmin } from '../lib/supabase.js';
// Use string literals instead of importing enums to avoid issues

async function freshSetup() {
  try {
    console.log('🚀 Starting fresh setup...\n');
    
    // Step 1: Clean up existing data
    console.log('🧹 Step 1: Cleaning up existing data...');
    
    // Delete all users except the ones we need to keep for auth
    const { error: deleteUsersError } = await supabaseAdmin
      .from('users')
      .delete()
      .neq('id', ''); // This deletes all records
    
    if (deleteUsersError) {
      console.log('⚠️  Could not delete users:', deleteUsersError.message);
    } else {
      console.log('✅ Deleted all users from database');
    }
    
    // Delete all tenants
    const { error: deleteTenantsError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .neq('id', ''); // This deletes all records
    
    if (deleteTenantsError) {
      console.log('⚠️  Could not delete tenants:', deleteTenantsError.message);
    } else {
      console.log('✅ Deleted all tenants from database');
    }
    
    // Step 2: Create new tenant
    console.log('\n🏢 Step 2: Creating new tenant...');
    
    const newTenant = {
      id: `tenant_${Date.now()}`,
      name: 'SweetSpot HQ',
      slug: 'sweetspot-hq',
      description: 'Main SweetSpot headquarters',
      settings: {},
      status: 'ACTIVE',
    };
    
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert(newTenant)
      .select()
      .single();
    
    if (tenantError) {
      console.error('❌ Failed to create tenant:', tenantError);
      return;
    }
    
    console.log('✅ Created tenant:', tenant.name, `(${tenant.slug})`);
    
    // Step 3: Create super admin user
    console.log('\n👤 Step 3: Creating super admin user...');
    
    const email = 'admin@sweetspot.io';
    const password = 'Admin123!';
    
    // First check if auth user exists
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === email);
    
    let authUserId: string;
    
    if (existingAuthUser) {
      console.log('🔄 Auth user exists, updating password...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password }
      );
      
      if (updateError) {
        console.error('❌ Failed to update auth user:', updateError);
        return;
      }
      authUserId = existingAuthUser.id;
    } else {
      console.log('📝 Creating new auth user...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      
      if (authError) {
        console.error('❌ Failed to create auth user:', authError);
        return;
      }
      
      authUserId = authData.user.id;
    }
    
    console.log('✅ Auth user ready:', email);
    
    // Step 4: Create user record in database
    console.log('\n📊 Step 4: Creating user record in database...');
    
    const newUser = {
      id: `user_${Date.now()}`,
      tenantId: tenant.id,
      supabaseId: authUserId,
      email,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    };
    
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Failed to create user record:', userError);
      return;
    }
    
    console.log('✅ Created user record:', user.email, `(${user.role})`);
    
    // Step 5: Test the login
    console.log('\n🧪 Step 5: Testing login...');
    
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError);
    } else {
      console.log('✅ Login test successful!');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Fresh setup completed successfully!\n');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Workspace: ${tenant.slug} (optional)\n`);
    console.log('🚀 You can now login to the frontend with these credentials.');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the setup
freshSetup();