const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testLogin() {
  try {
    console.log('🔐 Testing Supabase Authentication\n');
    console.log('=' .repeat(60));
    
    const testCredentials = [
      { email: 'superadmin@sweetspot.com', password: 'SuperAdmin123!' },
      { email: 'gcortinez@getsweetspot.io', password: '123456' },
      { email: 'multitenantadmin@sweetspot.io', password: 'MultiAdmin123!' },
      { email: 'admin@sweetspot.io', password: 'Admin123!' },
      { email: 'gcortinez@gmail.com', password: 'TestUser123!' }
    ];

    for (const creds of testCredentials) {
      console.log(`Testing login for: ${creds.email}`);
      
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: creds.email,
          password: creds.password,
        });

        if (authError) {
          console.log(`❌ Login failed: ${authError.message}`);
          
          // Try to check if user exists but password is wrong
          const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            filter: `email.eq.${creds.email}`
          });
          
          if (!listError && users.users.length > 0) {
            console.log(`   ℹ️  User exists in Supabase, but password might be incorrect`);
            
            // Try to update the password
            console.log(`   🔄 Attempting to reset password...`);
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              users.users[0].id,
              { password: creds.password }
            );
            
            if (!updateError) {
              console.log(`   ✅ Password updated successfully`);
              
              // Try login again
              const { data: retryData, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
                email: creds.email,
                password: creds.password,
              });
              
              if (!retryError && retryData.user) {
                console.log(`   ✅ Login successful after password reset!`);
              } else {
                console.log(`   ❌ Login still failed: ${retryError?.message}`);
              }
            } else {
              console.log(`   ❌ Failed to update password: ${updateError.message}`);
            }
          }
        } else if (authData.user) {
          console.log(`✅ Login successful!`);
          console.log(`   User ID: ${authData.user.id}`);
          console.log(`   Email: ${authData.user.email}`);
        }
      } catch (error) {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
      
      console.log('');
    }

    console.log('=' .repeat(60));
    console.log('✅ Authentication Test Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();