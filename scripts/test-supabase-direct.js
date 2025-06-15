require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseDirect() {
  console.log('🔍 Testing Supabase connection with service role...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service key length:', serviceKey?.length || 0);
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    console.log('📍 Testing Supabase REST API...');
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase REST API working!');
    console.log('Found tenants:', tenants?.length || 0);
    
    if (tenants && tenants.length > 0) {
      console.log('📊 Sample tenant:', {
        id: tenants[0].id,
        name: tenants[0].name,
        status: tenants[0].status
      });
    }
    
    // Try to create a test record to verify write permissions
    console.log('\n📍 Testing write permissions...');
    const testRecord = {
      name: 'Connection Test',
      slug: 'connection-test-' + Date.now(),
      status: 'ACTIVE'
    };
    
    const { data: created, error: createError } = await supabase
      .from('tenants')
      .insert(testRecord)
      .select()
      .single();
    
    if (createError) {
      console.log('⚠️  Write test failed:', createError.message);
    } else {
      console.log('✅ Write test successful');
      
      // Clean up test record
      await supabase.from('tenants').delete().eq('id', created.id);
      console.log('🧹 Cleaned up test record');
    }
    
    console.log('\n💡 Supabase connection is working fine!');
    console.log('   The issue is specifically with Prisma database credentials.');
    console.log('   You need to get fresh database connection strings from Supabase dashboard.');
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

testSupabaseDirect().catch(console.error);