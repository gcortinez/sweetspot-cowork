"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("../lib/supabase.js");
async function freshSetup() {
    try {
        console.log('🚀 Starting fresh setup...\n');
        console.log('🧹 Step 1: Cleaning up existing data...');
        const { error: deleteUsersError } = await supabase_js_1.supabaseAdmin
            .from('users')
            .delete()
            .neq('id', '');
        if (deleteUsersError) {
            console.log('⚠️  Could not delete users:', deleteUsersError.message);
        }
        else {
            console.log('✅ Deleted all users from database');
        }
        const { error: deleteTenantsError } = await supabase_js_1.supabaseAdmin
            .from('tenants')
            .delete()
            .neq('id', '');
        if (deleteTenantsError) {
            console.log('⚠️  Could not delete tenants:', deleteTenantsError.message);
        }
        else {
            console.log('✅ Deleted all tenants from database');
        }
        console.log('\n🏢 Step 2: Creating new tenant...');
        const newTenant = {
            id: `tenant_${Date.now()}`,
            name: 'SweetSpot HQ',
            slug: 'sweetspot-hq',
            description: 'Main SweetSpot headquarters',
            settings: {},
            status: 'ACTIVE',
        };
        const { data: tenant, error: tenantError } = await supabase_js_1.supabaseAdmin
            .from('tenants')
            .insert(newTenant)
            .select()
            .single();
        if (tenantError) {
            console.error('❌ Failed to create tenant:', tenantError);
            return;
        }
        console.log('✅ Created tenant:', tenant.name, `(${tenant.slug})`);
        console.log('\n👤 Step 3: Creating super admin user...');
        const email = 'admin@sweetspot.io';
        const password = 'Admin123!';
        const { data: authUsers } = await supabase_js_1.supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find(u => u.email === email);
        let authUserId;
        if (existingAuthUser) {
            console.log('🔄 Auth user exists, updating password...');
            const { error: updateError } = await supabase_js_1.supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, { password });
            if (updateError) {
                console.error('❌ Failed to update auth user:', updateError);
                return;
            }
            authUserId = existingAuthUser.id;
        }
        else {
            console.log('📝 Creating new auth user...');
            const { data: authData, error: authError } = await supabase_js_1.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (authError) {
                console.error('❌ Failed to create auth user:', authError);
                return;
            }
            authUserId = authData.user.id;
        }
        console.log('✅ Auth user ready:', email);
        console.log('\n📊 Step 4: Creating user record in database...');
        const newUser = {
            id: `user_${Date.now()}`,
            tenantId: tenant.id,
            supabaseId: authUserId,
            email,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
        };
        const { data: user, error: userError } = await supabase_js_1.supabaseAdmin
            .from('users')
            .insert(newUser)
            .select()
            .single();
        if (userError) {
            console.error('❌ Failed to create user record:', userError);
            return;
        }
        console.log('✅ Created user record:', user.email, `(${user.role})`);
        console.log('\n🧪 Step 5: Testing login...');
        const { data: loginData, error: loginError } = await supabase_js_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (loginError) {
            console.error('❌ Login test failed:', loginError);
        }
        else {
            console.log('✅ Login test successful!');
        }
        console.log('\n' + '='.repeat(50));
        console.log('✨ Fresh setup completed successfully!\n');
        console.log('📋 Login credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Workspace: ${tenant.slug} (optional)\n`);
        console.log('🚀 You can now login to the frontend with these credentials.');
        console.log('='.repeat(50));
    }
    catch (error) {
        console.error('❌ Setup failed:', error);
    }
    finally {
        process.exit(0);
    }
}
freshSetup();
//# sourceMappingURL=fresh-setup.js.map