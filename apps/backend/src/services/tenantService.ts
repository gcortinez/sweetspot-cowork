import { supabaseAdmin } from "../lib/supabase";
import { createUserWithTenant, setUserMetadata } from "../lib/rls";
import { TenantStatus, UserRole } from "@sweetspot/shared";

export interface CreateTenantRequest {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  settings?: Record<string, any>;
  adminUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  domain?: string;
  logo?: string;
  description?: string;
  settings?: Record<string, any>;
  status?: TenantStatus;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  settings?: Record<string, any>;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  clientCount?: number;
}

/**
 * Tenant Service
 * Handles all tenant-related operations including creation, management, and user association
 */
export class TenantService {
  /**
   * Create a new tenant with an admin user
   */
  static async createTenant(
    data: CreateTenantRequest
  ): Promise<TenantResponse> {
    try {
      // Validate slug uniqueness
      const existingTenant = await this.getTenantBySlug(data.slug);
      if (existingTenant) {
        throw new Error(`Tenant with slug '${data.slug}' already exists`);
      }

      // Validate domain uniqueness if provided
      if (data.domain) {
        const existingDomain = await this.getTenantByDomain(data.domain);
        if (existingDomain) {
          throw new Error(`Tenant with domain '${data.domain}' already exists`);
        }
      }

      // Generate unique ID for tenant
      const tenantId = `tenant_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create tenant record
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .insert({
          id: tenantId,
          name: data.name,
          slug: data.slug,
          domain: data.domain,
          logo: data.logo,
          description: data.description,
          settings: data.settings || {},
          status: "ACTIVE" as TenantStatus,
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      // Create admin user for the tenant
      const adminUser = await createUserWithTenant(
        data.adminUser.email,
        data.adminUser.password,
        tenant.id,
        "COWORK_ADMIN" as UserRole,
        data.adminUser.firstName,
        data.adminUser.lastName
      );

      if (!adminUser) {
        // Rollback tenant creation if admin user creation fails
        await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
        throw new Error("Failed to create admin user for tenant");
      }

      console.log(
        `✅ Created tenant: ${tenant.name} with admin user: ${data.adminUser.email}`
      );

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error("Error in createTenant:", error);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId: string): Promise<TenantResponse | null> {
    try {
      console.log(`[TenantService.getTenantById] Querying for tenant: ${tenantId}`);
      
      // Simplified query without counts to avoid potential issues
      const { data: tenant, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      console.log(`[TenantService.getTenantById] Query result:`, {
        found: !!tenant,
        error: error?.message,
        errorCode: error?.code,
      });

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`[TenantService.getTenantById] Tenant not found (PGRST116)`);
          return null; // Tenant not found
        }
        console.error("Error getting tenant by ID:", error);
        throw new Error(`Failed to get tenant: ${error.message}`);
      }

      // Get counts separately if needed
      let userCount = 0;
      let clientCount = 0;
      
      try {
        const { count: uCount } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("tenantId", tenantId);
        userCount = uCount || 0;
        
        const { count: cCount } = await supabaseAdmin
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("tenantId", tenantId);
        clientCount = cCount || 0;
      } catch (countError) {
        console.warn("Error getting counts:", countError);
        // Continue without counts
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        userCount,
        clientCount,
      };
    } catch (error) {
      console.error("Error in getTenantById:", error);
      throw error;
    }
  }

  /**
   * Get tenant by slug
   */
  static async getTenantBySlug(slug: string): Promise<TenantResponse | null> {
    try {
      const { data: tenant, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Tenant not found
        }
        console.error("Error getting tenant by slug:", error);
        throw new Error(`Failed to get tenant: ${error.message}`);
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error("Error in getTenantBySlug:", error);
      throw error;
    }
  }

  /**
   * Get tenant by domain
   */
  static async getTenantByDomain(
    domain: string
  ): Promise<TenantResponse | null> {
    try {
      const { data: tenant, error } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .eq("domain", domain)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Tenant not found
        }
        console.error("Error getting tenant by domain:", error);
        throw new Error(`Failed to get tenant: ${error.message}`);
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error("Error in getTenantByDomain:", error);
      throw error;
    }
  }


  /**
   * Update tenant
   */
  static async updateTenant(
    tenantId: string,
    data: UpdateTenantRequest
  ): Promise<TenantResponse> {
    try {
      // Validate slug uniqueness if being updated
      if (data.slug) {
        const existingTenant = await this.getTenantBySlug(data.slug);
        if (existingTenant && existingTenant.id !== tenantId) {
          throw new Error(`Tenant with slug '${data.slug}' already exists`);
        }
      }

      // Validate domain uniqueness if being updated
      if (data.domain) {
        const existingDomain = await this.getTenantByDomain(data.domain);
        if (existingDomain && existingDomain.id !== tenantId) {
          throw new Error(`Tenant with domain '${data.domain}' already exists`);
        }
      }

      const { data: tenant, error } = await supabaseAdmin
        .from("tenants")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating tenant:", error);
        throw new Error(`Failed to update tenant: ${error.message}`);
      }

      console.log(`✅ Updated tenant: ${tenant.name}`);

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error("Error in updateTenant:", error);
      throw error;
    }
  }

  /**
   * Delete tenant (soft delete by setting status to INACTIVE)
   */
  static async deleteTenant(
    tenantId: string,
    hardDelete: boolean = false
  ): Promise<void> {
    try {
      if (hardDelete) {
        // Hard delete - remove all related data
        // Note: This should be used with extreme caution
        const { error } = await supabaseAdmin
          .from("tenants")
          .delete()
          .eq("id", tenantId);

        if (error) {
          console.error("Error hard deleting tenant:", error);
          throw new Error(`Failed to delete tenant: ${error.message}`);
        }

        console.log(`🗑️ Hard deleted tenant: ${tenantId}`);
      } else {
        // Soft delete - set status to INACTIVE
        await this.updateTenant(tenantId, {
          status: "INACTIVE" as TenantStatus,
        });
        console.log(`🔒 Soft deleted tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error("Error in deleteTenant:", error);
      throw error;
    }
  }

  /**
   * Get all tenants with pagination and filtering (for Super Admin)
   */
  static async getAllTenants(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: TenantStatus;
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    tenants: TenantResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact" });

      // Apply filters
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Apply pagination
      const { data: tenants, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error getting all tenants:", error);
        throw new Error(`Failed to get tenants: ${error.message}`);
      }

      const formattedTenants: TenantResponse[] = tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      }));

      return {
        tenants: formattedTenants,
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error in getAllTenants:", error);
      throw error;
    }
  }

  /**
   * Get system-wide statistics (for Super Admin dashboard)
   */
  static async getSystemStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    inactiveTenants: number;
    totalUsers: number;
    totalClients: number;
    totalRevenue: number;
    recentTenants: TenantResponse[];
  }> {
    try {
      // Get tenant counts by status
      const { count: totalTenants } = await supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact", head: true });

      const { count: activeTenants } = await supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      const { count: suspendedTenants } = await supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "SUSPENDED");

      const { count: inactiveTenants } = await supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "INACTIVE");

      // Get total users across all tenants
      const { count: totalUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      // Get total clients across all tenants
      const { count: totalClients } = await supabaseAdmin
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      // Get total revenue across all tenants
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .eq("status", "PAID");

      const totalRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      // Get recent tenants (last 5)
      const { data: recentTenantsData } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .order("createdAt", { ascending: false })
        .limit(5);

      const recentTenants: TenantResponse[] = recentTenantsData?.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        logo: tenant.logo,
        description: tenant.description,
        settings: tenant.settings,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      })) || [];

      return {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        suspendedTenants: suspendedTenants || 0,
        inactiveTenants: inactiveTenants || 0,
        totalUsers: totalUsers || 0,
        totalClients: totalClients || 0,
        totalRevenue,
        recentTenants,
      };
    } catch (error) {
      console.error("Error getting system stats:", error);
      throw new Error("Failed to get system statistics");
    }
  }

  /**
   * Suspend tenant with enhanced options
   */
  static async suspendTenant(
    tenantId: string,
    options?: {
      reason?: string;
      suspendedBy?: string;
      notifyUsers?: boolean;
    }
  ): Promise<TenantResponse> {
    console.log(`Suspending tenant ${tenantId}:`, options);
    
    // TODO: Log the suspension action for audit trail
    // TODO: Implement user notifications if requested
    
    return this.updateTenant(tenantId, { status: "SUSPENDED" as TenantStatus });
  }

  /**
   * Activate tenant with enhanced options
   */
  static async activateTenant(
    tenantId: string,
    options?: {
      reason?: string;
      activatedBy?: string;
      notifyUsers?: boolean;
    }
  ): Promise<TenantResponse> {
    console.log(`Activating tenant ${tenantId}:`, options);
    
    // TODO: Log the activation action for audit trail
    // TODO: Implement user notifications if requested
    
    return this.updateTenant(tenantId, { status: "ACTIVE" as TenantStatus });
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId: string): Promise<{
    userCount: number;
    clientCount: number;
    activeBookings: number;
    totalRevenue: number;
    spacesCount: number;
  }> {
    try {
      // Get user count
      const { count: userCount } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "ACTIVE");

      // Get client count
      const { count: clientCount } = await supabaseAdmin
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "ACTIVE");

      // Get active bookings count
      const { count: activeBookings } = await supabaseAdmin
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "CONFIRMED");

      // Get spaces count
      const { count: spacesCount } = await supabaseAdmin
        .from("spaces")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "ACTIVE");

      // Calculate total revenue (from paid invoices)
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .eq("tenantId", tenantId)
        .eq("status", "PAID");

      const totalRevenue =
        invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      return {
        userCount: userCount || 0,
        clientCount: clientCount || 0,
        activeBookings: activeBookings || 0,
        totalRevenue,
        spacesCount: spacesCount || 0,
      };
    } catch (error) {
      console.error("Error getting tenant stats:", error);
      throw new Error("Failed to get tenant statistics");
    }
  }

  /**
   * Validate tenant slug format
   */
  static validateSlug(slug: string): boolean {
    // Slug should be lowercase, alphanumeric with hyphens, 3-50 characters
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    return slugRegex.test(slug);
  }

  /**
   * Generate unique slug from name
   */
  static async generateSlugFromName(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    // Ensure minimum length
    if (baseSlug.length < 3) {
      baseSlug = `cowork-${baseSlug}`;
    }

    // Ensure maximum length
    if (baseSlug.length > 50) {
      baseSlug = baseSlug.substring(0, 50);
    }

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and append number if needed
    while (await this.getTenantBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
