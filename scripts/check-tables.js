require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking existing database tables...\n');
    
    // Query to get all table names
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 All tables in database:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Check specifically for visitor-related tables
    const visitorTables = tables.filter(t => 
      t.table_name.includes('visitor') || 
      t.table_name.includes('access_code')
    );
    
    console.log('\n🎯 Visitor-related tables:');
    if (visitorTables.length > 0) {
      visitorTables.forEach(table => {
        console.log(`✅ ${table.table_name}`);
      });
    } else {
      console.log('❌ No visitor tables found');
    }
    
    // Test if we can query visitor data
    console.log('\n🧪 Testing visitor functionality...');
    try {
      const visitorCount = await prisma.visitor.count();
      console.log(`✅ Visitor table accessible - found ${visitorCount} visitors`);
    } catch (error) {
      console.log('❌ Visitor table not accessible:', error.message);
    }
    
    try {
      const preRegCount = await prisma.visitorPreRegistration.count();
      console.log(`✅ Pre-registration table accessible - found ${preRegCount} pre-registrations`);
    } catch (error) {
      console.log('❌ Pre-registration table not accessible:', error.message);
    }
    
    try {
      const notifCount = await prisma.visitorNotification.count();
      console.log(`✅ Notification table accessible - found ${notifCount} notifications`);
    } catch (error) {
      console.log('❌ Notification table not accessible:', error.message);
    }
    
    // Check enums
    console.log('\n🔧 Checking enums...');
    try {
      const enumCheck = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'VisitorStatus'
        ORDER BY enumlabel;
      `;
      console.log('✅ VisitorStatus enum values:', enumCheck.map(e => e.enumlabel).join(', '));
    } catch (error) {
      console.log('❌ VisitorStatus enum not found:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables().catch(console.error);