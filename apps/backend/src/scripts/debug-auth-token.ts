#!/usr/bin/env ts-node

import { supabaseAdmin } from '../lib/supabase';
import { getTenantContext } from '../lib/rls';
import { prisma } from '../lib/prisma';

async function debugAuthToken() {
  console.log('🔧 Debug Auth Token Issue');
  console.log('=====================================');

  const email = 'gcortinez@getsweetspot.io';

  try {
    // 1. Check user in our database using Supabase Admin (bypasses RLS)
    console.log('\n1. Checking user in our database...');
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, supabaseId, role, tenantId, status, createdAt')
      .eq('email', email)
      .single();

    if (userError || !userRecord) {
      console.error('❌ User not found in our database:', userError);
      return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', userRecord.id);
    console.log('   Email:', userRecord.email);
    console.log('   Supabase ID:', userRecord.supabaseId);
    console.log('   Role:', userRecord.role);
    console.log('   Tenant ID:', userRecord.tenantId);
    console.log('   Status:', userRecord.status);

    // 2. Check if Supabase user exists
    console.log('\n2. Checking Supabase Auth user...');
    if (userRecord.supabaseId) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userRecord.supabaseId);
      
      if (authError) {
        console.error('❌ Error getting Supabase user:', authError);
      } else if (authUser?.user) {
        console.log('✅ Supabase user found:');
        console.log('   ID:', authUser.user.id);
        console.log('   Email:', authUser.user.email);
        console.log('   Created:', authUser.user.created_at);
        console.log('   Last sign in:', authUser.user.last_sign_in_at);
        console.log('   Email confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
      } else {
        console.error('❌ Supabase user not found');
      }
    } else {
      console.error('❌ No supabaseId in our database record');
    }

    // 3. Try to create a test session token
    console.log('\n3. Creating test session token...');
    if (userRecord.supabaseId) {
      try {
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: userRecord.email
        });

        if (sessionError) {
          console.error('❌ Error generating magic link:', sessionError);
        } else {
          console.log('✅ Magic link generated successfully');
          console.log('   User ID:', sessionData.user.id);
          console.log('   User Email:', sessionData.user.email);
        }
      } catch (error) {
        console.error('❌ Error in magic link generation:', error);
      }
    }

    // 4. Check all users with this email in Supabase Auth
    console.log('\n4. Searching all Supabase Auth users with this email...');
    try {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
      } else {
        const matchingUsers = authUsers.users.filter(user => user.email === email);
        console.log(`✅ Found ${matchingUsers.length} Supabase Auth user(s) with email ${email}`);
        
        matchingUsers.forEach((user, index) => {
          console.log(`   User ${index + 1}:`);
          console.log(`     ID: ${user.id}`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Created: ${user.created_at}`);
          console.log(`     Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error searching Supabase users:', error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    // No need to disconnect prisma since we're using supabase admin
  }
}

debugAuthToken().catch(console.error);