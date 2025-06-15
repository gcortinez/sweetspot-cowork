-- Fix RLS policies to allow admin/service operations
-- This migration addresses the issue where admin operations are blocked by RLS

-- ============================================================================
-- HELPER FUNCTIONS FOR SERVICE ROLE DETECTION
-- ============================================================================

-- Function to check if current role is service role (admin client)
CREATE OR REPLACE FUNCTION auth.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if we're using the service role (no JWT token)
  RETURN auth.role() = 'service_role' OR auth.jwt() IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE TENANT TABLE POLICIES TO ALLOW SERVICE ROLE
-- ============================================================================

-- Drop existing tenant policies
DROP POLICY IF EXISTS "tenant_select_policy" ON "Tenant";
DROP POLICY IF EXISTS "tenant_insert_policy" ON "Tenant";
DROP POLICY IF EXISTS "tenant_update_policy" ON "Tenant";
DROP POLICY IF EXISTS "tenant_delete_policy" ON "Tenant";

-- Recreate tenant policies with service role support
CREATE POLICY "tenant_select_policy" ON "Tenant"
  FOR SELECT
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR 
    id = auth.get_user_tenant_id()
  );

-- Allow service role and super admins to insert new tenants
CREATE POLICY "tenant_insert_policy" ON "Tenant"
  FOR INSERT
  WITH CHECK (
    auth.is_service_role() OR
    auth.is_super_admin()
  );

-- Allow service role, super admins, and cowork admins to update tenants
CREATE POLICY "tenant_update_policy" ON "Tenant"
  FOR UPDATE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR 
    (auth.is_cowork_admin() AND id = auth.get_user_tenant_id())
  );

-- Allow service role and super admins to delete tenants
CREATE POLICY "tenant_delete_policy" ON "Tenant"
  FOR DELETE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin()
  );

-- ============================================================================
-- UPDATE USER TABLE POLICIES TO ALLOW SERVICE ROLE
-- ============================================================================

-- Drop existing user policies
DROP POLICY IF EXISTS "user_select_policy" ON "User";
DROP POLICY IF EXISTS "user_insert_policy" ON "User";
DROP POLICY IF EXISTS "user_update_policy" ON "User";
DROP POLICY IF EXISTS "user_delete_policy" ON "User";

-- Recreate user policies with service role support
CREATE POLICY "user_select_policy" ON "User"
  FOR SELECT
  USING (
    auth.is_service_role() OR
    auth.user_belongs_to_tenant(tenant_id)
  );

-- Allow service role, cowork admins and super admins to create users
CREATE POLICY "user_insert_policy" ON "User"
  FOR INSERT
  WITH CHECK (
    auth.is_service_role() OR
    auth.is_super_admin() OR 
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Allow service role and appropriate user/admin access for updates
CREATE POLICY "user_update_policy" ON "User"
  FOR UPDATE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.user_belongs_to_tenant(tenant_id) AND (
      supabase_id = auth.uid()::text OR
      auth.is_cowork_admin()
    ))
  );

-- Allow service role and admins to delete users
CREATE POLICY "user_delete_policy" ON "User"
  FOR DELETE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- UPDATE CLIENT TABLE POLICIES TO ALLOW SERVICE ROLE
-- ============================================================================

-- Drop existing client policies
DROP POLICY IF EXISTS "client_select_policy" ON "Client";
DROP POLICY IF EXISTS "client_insert_policy" ON "Client";
DROP POLICY IF EXISTS "client_update_policy" ON "Client";
DROP POLICY IF EXISTS "client_delete_policy" ON "Client";

-- Recreate client policies with service role support
CREATE POLICY "client_select_policy" ON "Client"
  FOR SELECT
  USING (
    auth.is_service_role() OR
    auth.user_belongs_to_tenant(tenant_id)
  );

-- Allow service role and cowork admins to manage clients
CREATE POLICY "client_insert_policy" ON "Client"
  FOR INSERT
  WITH CHECK (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "client_update_policy" ON "Client"
  FOR UPDATE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "client_delete_policy" ON "Client"
  FOR DELETE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- UPDATE ACCESS LOG POLICIES FOR BETTER SERVICE ROLE SUPPORT
-- ============================================================================

-- Drop existing access log policies
DROP POLICY IF EXISTS "access_log_select_policy" ON "AccessLog";
DROP POLICY IF EXISTS "access_log_insert_policy" ON "AccessLog";
DROP POLICY IF EXISTS "access_log_update_policy" ON "AccessLog";
DROP POLICY IF EXISTS "access_log_delete_policy" ON "AccessLog";

-- Recreate access log policies with better service role support
CREATE POLICY "access_log_select_policy" ON "AccessLog"
  FOR SELECT
  USING (
    auth.is_service_role() OR
    (auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    ))
  );

-- Allow service role to insert access logs (for system operations)
CREATE POLICY "access_log_insert_policy" ON "AccessLog"
  FOR INSERT
  WITH CHECK (
    auth.is_service_role() OR
    auth.user_belongs_to_tenant(tenant_id)
  );

-- Allow service role and admins to update access logs
CREATE POLICY "access_log_update_policy" ON "AccessLog"
  FOR UPDATE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Allow service role and super admins to delete access logs
CREATE POLICY "access_log_delete_policy" ON "AccessLog"
  FOR DELETE
  USING (
    auth.is_service_role() OR
    auth.is_super_admin()
  );

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS TO SERVICE ROLE
-- ============================================================================

-- Ensure service role has necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant auth schema permissions for user management
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO service_role;

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION auth.is_service_role() IS 'Checks if the current database role is service_role (admin operations)';
COMMENT ON POLICY "tenant_insert_policy" ON "Tenant" IS 'Allows service role and super admins to create tenants';
COMMENT ON POLICY "user_insert_policy" ON "User" IS 'Allows service role and admins to create users with proper tenant isolation';
COMMENT ON POLICY "client_insert_policy" ON "Client" IS 'Allows service role and admins to create clients with proper tenant isolation'; 