const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  try {
    console.log('Testing direct Supabase connection...');
    
    // Test 1: Simple query
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', 'gcortinez@getsweetspot.io');
    
    console.log('Users query result:', { 
      count: users?.length || 0, 
      error: usersError,
      users: users || []
    });
    
    // Test 2: Query by supabaseId
    const { data: userBySupabaseId, error: supabaseError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabaseId', 'd54e4b4a-4645-4c2a-afe8-060f0a4f8af8')
      .single();
    
    console.log('User by supabaseId:', {
      found: !!userBySupabaseId,
      error: supabaseError,
      user: userBySupabaseId || null
    });
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();