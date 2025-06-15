"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
console.log("🔍 Testing Environment Variable Loading");
console.log("=".repeat(50));
console.log("📁 Current working directory:", process.cwd());
const envPaths = [
    ".env.local",
    ".env",
    (0, path_1.join)(process.cwd(), ".env.local"),
    (0, path_1.join)(process.cwd(), ".env"),
];
for (const envPath of envPaths) {
    console.log(`\n📋 Trying to load: ${envPath}`);
    try {
        const result = dotenv_1.default.config({ path: envPath });
        if (result.error) {
            console.log(`❌ Error: ${result.error.message}`);
        }
        else {
            console.log(`✅ Loaded successfully`);
            console.log(`📊 Parsed ${Object.keys(result.parsed || {}).length} variables`);
        }
    }
    catch (error) {
        console.log(`❌ Exception: ${error}`);
    }
}
console.log("\n🔍 Current environment variables:");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
if (process.env.SUPABASE_URL) {
    console.log(`📍 SUPABASE_URL: ${process.env.SUPABASE_URL}`);
}
async function testSupabaseClient() {
    console.log("\n🔗 Testing Supabase client import...");
    try {
        const { supabaseAdmin } = await Promise.resolve().then(() => __importStar(require("../lib/supabase.js")));
        console.log("✅ Supabase client imported successfully");
        const { data, error } = await supabaseAdmin
            .from("tenants")
            .select("count")
            .limit(1);
        if (error) {
            console.log(`❌ Query failed: ${error.message}`);
        }
        else {
            console.log("✅ Query successful");
        }
    }
    catch (error) {
        console.log(`❌ Import failed: ${error}`);
    }
}
testSupabaseClient();
//# sourceMappingURL=test-env.js.map