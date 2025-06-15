"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
}
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
async function testUserQuery() {
    const email = "gcortinez@getsweetspot.io";
    console.log("🔍 Testing user query for:", email);
    console.log("📊 Using service role key:", supabaseServiceKey.substring(0, 20) + "...");
    console.log("\n1️⃣ Testing direct query:");
    const { data: users1, error: error1 } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email);
    console.log("Result:", {
        count: users1?.length || 0,
        error: error1?.message,
    });
    if (users1 && users1.length > 0) {
        console.log("User found:", users1[0]);
    }
    console.log("\n2️⃣ Testing with status filter:");
    const { data: users2, error: error2 } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("status", "ACTIVE");
    console.log("Result:", {
        count: users2?.length || 0,
        error: error2?.message,
    });
    console.log("\n3️⃣ Testing table access (first 5 users):");
    const { data: allUsers, error: error3 } = await supabaseAdmin
        .from("users")
        .select("id, email, status")
        .limit(5);
    console.log("Result:", {
        count: allUsers?.length || 0,
        error: error3?.message,
    });
    if (allUsers) {
        allUsers.forEach((user) => {
            console.log(`  - ${user.email} (${user.status})`);
        });
    }
    console.log("\n4️⃣ Testing table names:");
    const { data: tables, error: error4 } = await supabaseAdmin
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .like("table_name", "%user%");
    console.log("Tables with 'user' in name:", tables?.map((t) => t.table_name) || []);
}
testUserQuery().catch(console.error);
//# sourceMappingURL=test-user-query.js.map