import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables if not already loaded
if (!process.env.SUPABASE_URL) {
  dotenv.config();
}

// Debug environment loading
console.log("[supabase.ts] Environment check:");
console.log("[supabase.ts] SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Not set");
console.log("[supabase.ts] SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set (length: " + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ")" : "Not set");
console.log("[supabase.ts] SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Set" : "Not set");

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing SUPABASE_ANON_KEY environment variable");
}

// Admin client with service role key for backend operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
    },
  }
);

// Regular client with anon key for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Helper function to get user from JWT token
export const getUserFromToken = async (token: string) => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
};

// Helper function to verify user session
export const verifySession = async (accessToken: string) => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error verifying session:", error);
    return null;
  }
};

// Helper function to create a client for a specific user
export const createUserClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
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

export default supabase;
