"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
function checkEnvironmentSetup() {
    console.log("🔧 Checking Environment Setup...\n");
    const requiredVars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
    ];
    console.log("📋 Current environment variables:");
    requiredVars.forEach((varName) => {
        const value = process.env[varName];
        const isSet = value &&
            value !== "your-project-ref.supabase.co" &&
            value !== "your-anon-key-here" &&
            value !== "your-service-role-key-here";
        console.log(`   ${varName}: ${isSet ? "✅ Set" : "❌ Not set or using placeholder"}`);
        if (value && !isSet) {
            console.log(`      Current value: ${value}`);
        }
    });
    const allSet = requiredVars.every((varName) => {
        const value = process.env[varName];
        return (value &&
            value !== "your-project-ref.supabase.co" &&
            value !== "your-anon-key-here" &&
            value !== "your-service-role-key-here");
    });
    if (!allSet) {
        console.log("\n❌ Environment setup incomplete!");
        console.log("\n📝 To set up your Supabase credentials:");
        console.log("   1. Go to https://supabase.com/dashboard");
        console.log("   2. Create a new project or select an existing one");
        console.log("   3. Go to Settings > API");
        console.log("   4. Copy the following values:");
        console.log("      - Project URL (e.g., https://abcdefgh.supabase.co)");
        console.log("      - anon public key");
        console.log("      - service_role secret key");
        console.log("   5. Update your .env.local file with these values");
        console.log("\n📄 Your .env.local file should look like:");
        console.log("   SUPABASE_URL=https://your-project-id.supabase.co");
        console.log("   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
        console.log("   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
        console.log("\n⚠️  Keep your service_role key secret - it has admin access!");
        process.exit(1);
    }
    console.log("\n✅ Environment setup looks good!");
    console.log("🚀 You can now test the Supabase connection.");
    console.log("\n📋 Next steps:");
    console.log("   1. Run: npx tsx src/scripts/test-supabase-connection.ts");
    console.log("   2. If tables are missing, run: npm run db:push");
    console.log("   3. Run the RLS migration if needed");
}
if (require.main === module) {
    checkEnvironmentSetup();
}
//# sourceMappingURL=check-env.js.map