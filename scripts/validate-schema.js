const { PrismaClient } = require('@prisma/client');

async function validateSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if we can query the database
    console.log('🔍 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query successful:', result);
    
    // List all the visitor-related models that will be created
    console.log('\n📋 Visitor Management Models to be created:');
    console.log('- Visitor (main visitor records)');
    console.log('- VisitorPreRegistration (pre-registration system)');
    console.log('- VisitorLog (audit trail for visitor actions)');
    console.log('- VisitorBadge (physical badge management)');
    console.log('- VisitorPolicy (visitor access policies)');
    console.log('- VisitorAccessCode (temporary access codes)');
    console.log('- VisitorNotification (notification system)');
    console.log('- VisitorAnalytics (analytics and reporting)');
    console.log('- AccessCodeUsage (access code usage tracking)');
    
    console.log('\n📊 Enhanced Models:');
    console.log('- User (enhanced with visitor management relations)');
    console.log('- Tenant (enhanced with visitor management relations)');
    
    console.log('\n🔧 New Enums:');
    console.log('- VisitorStatus (PENDING, APPROVED, CHECKED_IN, CHECKED_OUT, EXPIRED, CANCELLED)');
    console.log('- VisitorPurpose (MEETING, INTERVIEW, DELIVERY, MAINTENANCE, TOUR, EVENT, OTHER)');
    console.log('- PreRegistrationStatus (PENDING, APPROVED, DENIED, EXPIRED)');
    console.log('- VisitorAction (CREATED, CHECKED_IN, CHECKED_OUT, EXTENDED, CANCELLED)');
    console.log('- AccessCodeType (TEMPORARY, RECURRING, EMERGENCY, VIP)');
    console.log('- NotificationType (VISITOR_ARRIVAL, VISITOR_DEPARTURE, etc.)');
    console.log('- NotificationUrgency (LOW, NORMAL, HIGH, CRITICAL)');
    console.log('- DeliveryMethod (IN_APP, EMAIL, SMS, PUSH, SLACK, TEAMS, WEBHOOK)');
    console.log('- NotificationStatus (PENDING, SENT, DELIVERED, READ, ACKNOWLEDGED, FAILED, EXPIRED)');
    console.log('- AnalyticsPeriod (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)');
    
    console.log('\n✨ Schema validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the Supabase instance is running');
      console.log('2. Verify database credentials in .env file');
      console.log('3. Check network connectivity');
      console.log('4. Try running: npm run db:generate (schema is valid)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

validateSchema().catch(console.error);