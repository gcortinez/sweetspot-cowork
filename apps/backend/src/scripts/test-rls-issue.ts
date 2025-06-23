#!/usr/bin/env ts-node

import { supabaseAdmin } from '../lib/supabase';

async function testRLSIssue() {
  console.log('🔧 Testing RLS Issue with Super Admin');
  console.log('=====================================');

  const supabaseUserId = 'd54e4b4a-4645-4c2a-afe8-060f0a4f8af8';

  try {
    console.log('\n1. Testing exact query from getTenantContext...');
    
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId")
      .eq("supabaseId", supabaseUserId)
      .single();

    if (userError) {
      console.error('❌ Error from getTenantContext query:', userError);
      console.error('   Code:', userError.code);
      console.error('   Details:', userError.details);
      console.error('   Message:', userError.message);
    } else if (userRecord) {
      console.log('✅ User record found:');
      console.log('   ID:', userRecord.id);
      console.log('   Tenant ID:', userRecord.tenantId);
      console.log('   Role:', userRecord.role);
      console.log('   Client ID:', userRecord.clientId);
    }

    console.log('\n2. Testing with broader select...');
    
    const { data: allUserRecords, error: allError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("supabaseId", supabaseUserId);

    if (allError) {
      console.error('❌ Error from broader query:', allError);
    } else {
      console.log('✅ Broader query results:', allUserRecords?.length || 0, 'records');
      if (allUserRecords && allUserRecords.length > 0) {
        console.log('   First record:', {
          id: allUserRecords[0].id,
          email: allUserRecords[0].email,
          tenantId: allUserRecords[0].tenantId,
          role: allUserRecords[0].role
        });
      }
    }

    console.log('\n3. Testing without filtering by supabaseId...');
    
    const { data: emailUserRecords, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id, tenantId, role, clientId, supabaseId")
      .eq("email", "gcortinez@getsweetspot.io");

    if (emailError) {
      console.error('❌ Error from email query:', emailError);
    } else {
      console.log('✅ Email query results:', emailUserRecords?.length || 0, 'records');
      emailUserRecords?.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, {
          id: record.id,
          tenantId: record.tenantId,
          role: record.role,
          supabaseId: record.supabaseId
        });
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRLSIssue().catch(console.error);