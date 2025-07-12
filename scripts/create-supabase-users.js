const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

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

async function createSupabaseUsers() {
  try {
    console.log('🔐 Creating Supabase Auth Users for Existing Database Users\n');
    console.log('=' .repeat(60));
    
    // Get all users from our database that might not exist in Supabase
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    console.log(`Found ${users.length} active users in database\n`);

    for (const user of users) {
      console.log(`Processing: ${user.email}`);
      
      // Check if user already exists in Supabase
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${user.email}`
      });

      if (listError) {
        console.error(`❌ Error checking existing users: ${listError.message}`);
        continue;
      }

      const existingUser = existingUsers.users.find(u => u.email === user.email);
      
      if (existingUser) {
        console.log(`✅ User already exists in Supabase Auth: ${user.email}`);
        
        // Update our database with the Supabase ID if it's missing
        if (!user.supabaseId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { supabaseId: existingUser.id }
          });
          console.log(`📝 Updated database with Supabase ID for ${user.email}`);
        }
        continue;
      }

      // Determine password based on known test accounts
      let password;
      if (user.email === 'superadmin@sweetspot.com') {
        password = 'SuperAdmin123!';
      } else if (user.email === 'gcortinez@getsweetspot.io') {
        password = 'TempPassword123!'; // Temporary password - should be changed
      } else if (user.email === 'multitenantadmin@sweetspot.io') {
        password = 'MultiAdmin123!'; // Temporary password
      } else if (user.email === 'admin@sweetspot.io') {
        password = 'Admin123!'; // Temporary password
      } else if (user.email === 'gcortinez@gmail.com') {
        password = 'TestUser123!'; // Temporary password
      } else {
        password = 'TempPassword123!'; // Default temporary password
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true, // Auto-confirm email for testing
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        }
      });

      if (authError) {
        console.error(`❌ Failed to create Supabase user for ${user.email}: ${authError.message}`);
        continue;
      }

      console.log(`✅ Created Supabase Auth user: ${user.email}`);
      console.log(`🔒 Password: ${password}`);

      // Update our database with the Supabase ID
      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseId: authData.user.id }
      });

      console.log(`📝 Updated database with Supabase ID\n`);
    }

    console.log('=' .repeat(60));
    console.log('✅ User Creation Complete!\n');
    
    console.log('🔐 Updated Test Credentials:');
    console.log('-'.repeat(40));
    console.log('📧 Email: superadmin@sweetspot.com');
    console.log('🔒 Password: SuperAdmin123!');
    console.log('🌐 URL: http://localhost:3000/login');
    console.log('🎯 Access: Global (all tenants)\n');
    
    console.log('Other Test Accounts:');
    console.log('📧 gcortinez@getsweetspot.io - Password: TempPassword123!');
    console.log('📧 multitenantadmin@sweetspot.io - Password: MultiAdmin123!');
    console.log('📧 admin@sweetspot.io - Password: Admin123!');
    console.log('📧 gcortinez@gmail.com - Password: TestUser123!\n');
    
    console.log('⚠️  SECURITY NOTE:');
    console.log('These are temporary passwords for testing. In production:');
    console.log('1. Use strong, unique passwords');
    console.log('2. Require password reset on first login');
    console.log('3. Enable MFA for admin accounts');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSupabaseUsers();