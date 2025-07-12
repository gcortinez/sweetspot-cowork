import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Create Supabase client for browser
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Helper function to get current session
export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting current session:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
};

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
};

// Helper function to sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error("Error signing in:", error);
    return { user: null, session: null, error };
  }
};

// Helper function to sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: any
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error("Error signing up:", error);
    return { user: null, session: null, error };
  }
};

// Helper function to reset password
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("Error resetting password:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error resetting password:", error);
    return false;
  }
};

// Helper function to update password
export const updatePassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Error updating password:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    return false;
  }
};

export default supabase;
