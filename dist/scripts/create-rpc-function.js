"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("../lib/supabase.js");
async function createRPCFunction() {
    try {
        console.log('🔧 Creating get_user_by_email RPC function...');
        const functionSQL = `
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (
  id text,
  email text,
  role text,
  status text,
  "tenantId" text,
  "firstName" text,
  "lastName" text,
  "clientId" text,
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  "lastLoginAt" timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role::text,
    u.status::text,
    u."tenantId",
    u."firstName",
    u."lastName", 
    u."clientId",
    u."createdAt",
    u."updatedAt",
    u."lastLoginAt"
  FROM users u
  WHERE u.email = user_email
    AND u.status = 'ACTIVE';
END;
$$;
    `;
        const { data, error } = await supabase_js_1.supabaseAdmin.rpc('exec_sql', { sql: functionSQL });
        if (error) {
            console.error('❌ Failed to create RPC function:', error);
            console.log('⚠️ Trying alternative SQL execution...');
            const { data: altData, error: altError } = await supabase_js_1.supabaseAdmin
                .from('__migrations')
                .select('*')
                .limit(1);
            if (altError) {
                console.log('📝 Using direct SQL execution approach...');
                console.log('SQL to execute manually in Supabase dashboard:');
                console.log('=====================================');
                console.log(functionSQL);
                console.log('=====================================');
                return;
            }
        }
        console.log('✅ RPC function created successfully');
        console.log('🧪 Testing the function...');
        const { data: testData, error: testError } = await supabase_js_1.supabaseAdmin.rpc('get_user_by_email', {
            user_email: 'gcortinez@getsweetspot.io'
        });
        if (testError) {
            console.error('❌ Function test failed:', testError);
        }
        else {
            console.log('✅ Function test successful, found users:', testData?.length || 0);
            if (testData && testData.length > 0) {
                testData.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.email} (${user.role}) - Status: ${user.status}`);
                });
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
createRPCFunction();
//# sourceMappingURL=create-rpc-function.js.map