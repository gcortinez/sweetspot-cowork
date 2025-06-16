require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createTestUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Creating test user in Supabase Auth...');
    
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@sweetspot.io',
      password: 'password123',
      email_confirm: true
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Created auth user:', authUser.user.id);
    
    // Create user in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: `user_${Date.now()}`,
        supabaseId: authUser.user.id,
        email: 'test@sweetspot.io',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant_1749874836546', // Use the existing tenant
        role: 'COWORK_ADMIN',
        status: 'ACTIVE'
      })
      .select()
      .single();
      
    if (dbError) {
      console.error('Database error:', dbError);
      return;
    }
    
    console.log('Created database user:', dbUser);
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@sweetspot.io');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();