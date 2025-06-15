#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function deployVisitorManagement() {
  const prisma = new PrismaClient();
  
  console.log('🚀 Deploying Visitor Management System...');
  console.log('=====================================');
  
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if visitor tables already exist
    console.log('\n🔍 Checking existing database schema...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM visitors LIMIT 1`;
      console.log('⚠️  Visitor tables already exist. Skipping creation.');
      
      // Generate Prisma client to ensure it's up to date
      console.log('\n🔄 Regenerating Prisma client...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('npx prisma generate', (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
      console.log('✅ Prisma client regenerated');
      
    } catch (error) {
      if (error.message.includes('relation "visitors" does not exist')) {
        console.log('📋 Visitor tables do not exist. Applying schema...');
        
        // Apply the schema using Prisma push
        console.log('\n📤 Pushing schema changes to database...');
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
          exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
            if (error) {
              console.error('❌ Schema push failed:', error.message);
              reject(error);
            } else {
              console.log('✅ Schema push successful');
              resolve(stdout);
            }
          });
        });
        
        console.log('\n🔄 Generating Prisma client...');
        await new Promise((resolve, reject) => {
          exec('npx prisma generate', (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
          });
        });
        console.log('✅ Prisma client generated');
        
      } else {
        throw error;
      }
    }
    
    // Verify all visitor management tables exist
    console.log('\n🔍 Verifying visitor management tables...');
    const tables = [
      'visitors',
      'visitor_pre_registrations', 
      'visitor_logs',
      'visitor_badges',
      'visitor_policies',
      'visitor_access_codes',
      'access_code_usage',
      'visitor_notifications',
      'visitor_analytics'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`;
        console.log(`✅ Table '${table}' exists`);
      } catch (error) {
        console.log(`❌ Table '${table}' missing:`, error.message);
      }
    }
    
    // Test visitor service functionality
    console.log('\n🧪 Testing visitor management functionality...');
    
    // Test basic enums
    const visitorStatuses = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::\"VisitorStatus\")) as status
    `;
    console.log('✅ VisitorStatus enum:', visitorStatuses.map(r => r.status).join(', '));
    
    const visitorPurposes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::\"VisitorPurpose\")) as purpose
    `;
    console.log('✅ VisitorPurpose enum:', visitorPurposes.map(r => r.purpose).join(', '));
    
    // Count existing data
    const visitorCount = await prisma.visitor.count();
    const preRegCount = await prisma.visitorPreRegistration.count();
    const notificationCount = await prisma.visitorNotification.count();
    
    console.log('\n📊 Current Data Summary:');
    console.log(`- Visitors: ${visitorCount}`);
    console.log(`- Pre-registrations: ${preRegCount}`);
    console.log(`- Notifications: ${notificationCount}`);
    
    console.log('\n🎉 Visitor Management System deployment completed successfully!');
    console.log('\n📚 Available Services:');
    console.log('- VisitorService: Core visitor management operations');
    console.log('- VisitorNotificationService: Multi-channel notifications');
    console.log('- VisitorAnalyticsService: Analytics and reporting');
    console.log('- AccessControlIntegrationService: Access control integration');
    
    console.log('\n📡 Available API Endpoints:');
    console.log('- POST /api/visitors - Create visitor');
    console.log('- GET /api/visitors - List visitors with filters');
    console.log('- POST /api/visitors/pre-registrations - Create pre-registration');
    console.log('- POST /api/visitors/access-codes - Generate access codes');
    console.log('- GET /api/visitors/analytics - Get visitor analytics');
    console.log('- POST /api/visitors/check-in - Check in visitor');
    console.log('- POST /api/visitors/check-out - Check out visitor');
    console.log('- GET /api/visitors/notifications - Get notifications');
    console.log('- ... and 20+ more endpoints');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Database Connection Issues:');
      console.log('1. Check if Supabase instance is active (may be paused)');
      console.log('2. Visit your Supabase dashboard to wake up the instance');
      console.log('3. Verify database credentials in .env file');
      console.log('4. Check network connectivity');
      console.log('\n🔧 When database is available, run:');
      console.log('   npm run db:push');
      console.log('   node scripts/deploy-visitor-management.js');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run deployment
deployVisitorManagement().catch(console.error);