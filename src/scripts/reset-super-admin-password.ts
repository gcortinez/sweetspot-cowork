import { supabaseAdmin } from '../lib/supabase.js';

async function resetPassword() {
  try {
    const email = 'gcortinez@getsweetspot.io';
    const newPassword = '123456';
    
    console.log('🔑 Resetting password for:', email);
    
    // Get the user first
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('List users error:', listError);
      return;
    }
    
    const user = authUsers?.users?.find(u => u.email === email);
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user ID:', user.id);
    
    // Update the user's password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('Password reset error:', error);
      return;
    }
    
    console.log('✅ Password reset successful for:', email);
    console.log('New password:', newPassword);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();