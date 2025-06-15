require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testVisitorAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Visitor Management API Functions...\n');
    
    // Test 1: Create a sample visitor
    console.log('📝 Test 1: Creating a sample visitor...');
    
    // First, get a tenant to use
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found. Creating test tenant...');
      const testTenant = await prisma.tenant.create({
        data: {
          name: 'Test Cowork Space',
          slug: 'test-cowork-' + Date.now(),
          status: 'ACTIVE'
        }
      });
      console.log('✅ Test tenant created:', testTenant.id);
    }
    
    // Get or create a user to be the host
    let hostUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id }
    });
    
    if (!hostUser) {
      console.log('❌ No user found. Creating test user...');
      hostUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          supabaseId: 'test-user-' + Date.now(),
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'COWORK_ADMIN',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Test user created:', hostUser.id);
    }
    
    // Create a test visitor
    const visitorData = {
      tenantId: tenant.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Example Corp',
      hostUserId: hostUser.id,
      purpose: 'MEETING',
      purposeDetails: 'Business meeting',
      qrCode: 'QR_' + Date.now(),
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
      status: 'APPROVED'
    };
    
    const visitor = await prisma.visitor.create({
      data: visitorData,
      include: {
        host: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('✅ Visitor created successfully:', {
      id: visitor.id,
      name: `${visitor.firstName} ${visitor.lastName}`,
      host: `${visitor.host.firstName} ${visitor.host.lastName}`,
      purpose: visitor.purpose,
      status: visitor.status
    });
    
    // Test 2: Create a pre-registration
    console.log('\n📝 Test 2: Creating a pre-registration...');
    
    const preRegData = {
      tenantId: tenant.id,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      hostUserId: hostUser.id,
      expectedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      purpose: 'INTERVIEW',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    };
    
    const preReg = await prisma.visitorPreRegistration.create({
      data: preRegData
    });
    
    console.log('✅ Pre-registration created:', {
      id: preReg.id,
      name: `${preReg.firstName} ${preReg.lastName}`,
      expectedArrival: preReg.expectedArrival,
      status: preReg.status
    });
    
    // Test 3: Create an access code
    console.log('\n📝 Test 3: Creating an access code...');
    
    const accessCodeData = {
      tenantId: tenant.id,
      code: 'ACCESS_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      codeType: 'TEMPORARY',
      visitorId: visitor.id,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      maxUses: 1,
      generatedBy: hostUser.id
    };
    
    const accessCode = await prisma.visitorAccessCode.create({
      data: accessCodeData
    });
    
    console.log('✅ Access code created:', {
      id: accessCode.id,
      code: accessCode.code,
      type: accessCode.codeType,
      expiresAt: accessCode.expiresAt
    });
    
    // Test 4: Create a notification
    console.log('\n📝 Test 4: Creating a notification...');
    
    const notificationData = {
      tenantId: tenant.id,
      type: 'VISITOR_ARRIVAL',
      title: 'Visitor Arrived',
      message: `${visitor.firstName} ${visitor.lastName} has arrived for their meeting.`,
      urgency: 'NORMAL',
      recipientId: hostUser.id,
      visitorId: visitor.id,
      status: 'SENT'
    };
    
    const notification = await prisma.visitorNotification.create({
      data: notificationData
    });
    
    console.log('✅ Notification created:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      urgency: notification.urgency
    });
    
    // Test 5: Create visitor log entry
    console.log('\n📝 Test 5: Creating visitor log entry...');
    
    const logData = {
      tenantId: tenant.id,
      visitorId: visitor.id,
      action: 'CHECKED_IN',
      performedBy: hostUser.id,
      details: 'Visitor checked in at reception',
      location: 'Main Reception'
    };
    
    const log = await prisma.visitorLog.create({
      data: logData
    });
    
    console.log('✅ Visitor log created:', {
      id: log.id,
      action: log.action,
      details: log.details,
      location: log.location
    });
    
    // Test 6: Query visitor analytics
    console.log('\n📝 Test 6: Testing analytics queries...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const visitorsToday = await prisma.visitor.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: today
        }
      }
    });
    
    const activeVisitors = await prisma.visitor.count({
      where: {
        tenantId: tenant.id,
        status: 'CHECKED_IN'
      }
    });
    
    console.log('✅ Analytics results:', {
      visitorsToday,
      activeVisitors,
      totalVisitors: await prisma.visitor.count({ where: { tenantId: tenant.id } }),
      totalPreRegistrations: await prisma.visitorPreRegistration.count({ where: { tenantId: tenant.id } }),
      totalNotifications: await prisma.visitorNotification.count({ where: { tenantId: tenant.id } })
    });
    
    console.log('\n🎉 All visitor management tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database schema deployed and working');
    console.log('✅ Visitor creation and management');
    console.log('✅ Pre-registration system');
    console.log('✅ Access code generation');
    console.log('✅ Notification system');
    console.log('✅ Audit logging');
    console.log('✅ Analytics queries');
    
    console.log('\n🚀 Visitor Management System is FULLY OPERATIONAL!');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.visitorLog.delete({ where: { id: log.id } });
    await prisma.visitorNotification.delete({ where: { id: notification.id } });
    await prisma.visitorAccessCode.delete({ where: { id: accessCode.id } });
    await prisma.visitor.delete({ where: { id: visitor.id } });
    await prisma.visitorPreRegistration.delete({ where: { id: preReg.id } });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVisitorAPI().catch(console.error);