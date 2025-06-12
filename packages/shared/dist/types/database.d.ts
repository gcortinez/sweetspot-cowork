export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    domain: string | null;
                    logo: string | null;
                    description: string | null;
                    settings: any | null;
                    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    domain?: string | null;
                    logo?: string | null;
                    description?: string | null;
                    settings?: any | null;
                    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    domain?: string | null;
                    logo?: string | null;
                    description?: string | null;
                    settings?: any | null;
                    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    created_at?: string;
                    updated_at?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    tenant_id: string;
                    supabase_id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone: string | null;
                    avatar: string | null;
                    role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    last_login_at: string | null;
                    client_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    supabase_id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone?: string | null;
                    avatar?: string | null;
                    role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    last_login_at?: string | null;
                    client_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    supabase_id?: string;
                    email?: string;
                    first_name?: string;
                    last_name?: string;
                    phone?: string | null;
                    avatar?: string | null;
                    role?: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    last_login_at?: string | null;
                    client_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    email: string;
                    phone: string | null;
                    address: string | null;
                    tax_id: string | null;
                    contact_person: string | null;
                    status: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    email: string;
                    phone?: string | null;
                    address?: string | null;
                    tax_id?: string | null;
                    contact_person?: string | null;
                    status?: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    email?: string;
                    phone?: string | null;
                    address?: string | null;
                    tax_id?: string | null;
                    contact_person?: string | null;
                    status?: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            tenant_status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
            user_role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
            user_status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
            client_status: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
export type Tenant = Tables<"tenants">;
export type User = Tables<"users">;
export type Client = Tables<"clients">;
export type TenantStatus = Enums<"tenant_status">;
export type UserRole = Enums<"user_role">;
export type UserStatus = Enums<"user_status">;
export type ClientStatus = Enums<"client_status">;
//# sourceMappingURL=database.d.ts.map