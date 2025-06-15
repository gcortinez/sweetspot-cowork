"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserClient = exports.verifySession = exports.getUserFromToken = exports.supabase = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable");
}
if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}
if (!supabaseAnonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY environment variable");
}
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
});
const getUserFromToken = async (token) => {
    try {
        const { data: { user }, error, } = await exports.supabase.auth.getUser(token);
        if (error) {
            throw error;
        }
        return user;
    }
    catch (error) {
        console.error("Error getting user from token:", error);
        return null;
    }
};
exports.getUserFromToken = getUserFromToken;
const verifySession = async (accessToken) => {
    try {
        const { data: { user }, error, } = await exports.supabase.auth.getUser(accessToken);
        if (error || !user) {
            return null;
        }
        return user;
    }
    catch (error) {
        console.error("Error verifying session:", error);
        return null;
    }
};
exports.verifySession = verifySession;
const createUserClient = (accessToken) => {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
exports.createUserClient = createUserClient;
exports.default = exports.supabase;
//# sourceMappingURL=supabase.js.map