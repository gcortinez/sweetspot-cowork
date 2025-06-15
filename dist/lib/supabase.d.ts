import { Database } from "@sweetspot/shared";
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export declare const getUserFromToken: (token: string) => Promise<import("@supabase/supabase-js").AuthUser | null>;
export declare const verifySession: (accessToken: string) => Promise<import("@supabase/supabase-js").AuthUser | null>;
export declare const createUserClient: (accessToken: string) => import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export default supabase;
//# sourceMappingURL=supabase.d.ts.map