const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connections...');
  
  // Test with pooled connection
  const prismaPooled = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  // Test with direct connection
  const prismaDirect = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  });
  
  try {
    console.log('\n📍 Testing pooled connection...');
    console.log('URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    await prismaPooled.$connect();
    await prismaPooled.$queryRaw`SELECT 1 as test`;
    console.log('✅ Pooled connection successful!');
    await prismaPooled.$disconnect();
  } catch (error) {
    console.log('❌ Pooled connection failed:', error.message);
  }
  
  try {
    console.log('\n📍 Testing direct connection...');
    console.log('URL:', process.env.DIRECT_URL?.substring(0, 50) + '...');
    await prismaDirect.$connect();
    await prismaDirect.$queryRaw`SELECT 1 as test`;
    console.log('✅ Direct connection successful!');
    await prismaDirect.$disconnect();
  } catch (error) {
    console.log('❌ Direct connection failed:', error.message);
  }
  
  console.log('\n💡 If both connections fail, the Supabase instance might be:');
  console.log('- Paused (free tier auto-pauses after inactivity)');
  console.log('- Having temporary connectivity issues');
  console.log('- Requiring credential refresh');
  console.log('\n🔧 Try visiting your Supabase dashboard to wake up the instance');
}

testConnection().catch(console.error);