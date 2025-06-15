const { PrismaClient } = require('@prisma/client');

async function testSimplePrisma() {
  console.log('🔍 Testing Prisma with minimal configuration...');
  
  // Test with very basic configuration
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: 'postgresql://postgres.qyozasdgumobhlwfdihh:7TXgSqIgXGmidnMg@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
      }
    }
  });
  
  try {
    console.log('📍 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    console.log('📍 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT current_user, version()`;
    console.log('✅ Query successful:', result);
    
    console.log('📍 Testing table access...');
    const tenants = await prisma.tenant.findMany({ take: 1 });
    console.log('✅ Tenant query successful, found:', tenants.length, 'tenants');
    
    if (tenants.length > 0) {
      console.log('📍 Sample tenant:', tenants[0]);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.log('\n💡 This error suggests the database user exists but may have limited permissions');
      console.log('   Try these solutions:');
      console.log('   1. Check if the password is correct');
      console.log('   2. Verify the user has proper permissions');
      console.log('   3. Try regenerating database credentials in Supabase dashboard');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testSimplePrisma().catch(console.error);