-- Enable Row Level Security on all tables
-- This migration sets up comprehensive multi-tenant data isolation

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Core tenant management
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

-- User management
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Client management (CRM)
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Quotations and contracts
ALTER TABLE "Quotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuotationItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;

-- Plans and memberships
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QRCode" ENABLE ROW LEVEL SECURITY;

-- Spaces and resources
ALTER TABLE "Space" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;

-- Booking system
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingResource" ENABLE ROW LEVEL SECURITY;

-- Services and consumption
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceConsumption" ENABLE ROW LEVEL SECURITY;

-- Visitor management
ALTER TABLE "Visitor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitorAccess" ENABLE ROW LEVEL SECURITY;

-- Access control
ALTER TABLE "AccessLog" ENABLE ROW LEVEL SECURITY;

-- Billing and payments
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountBalance" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get current user's tenant_id from JWT claims
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'tenant_id',
    (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role from JWT claims
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'role',
    (auth.jwt() -> 'user_metadata' ->> 'role')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is cowork admin for a tenant
CREATE OR REPLACE FUNCTION auth.is_cowork_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.get_user_role() IN ('SUPER_ADMIN', 'COWORK_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to a specific tenant
CREATE OR REPLACE FUNCTION auth.user_belongs_to_tenant(tenant_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.is_super_admin() OR auth.get_user_tenant_id() = tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANT TABLE POLICIES
-- ============================================================================

-- Super admins can see all tenants, others can only see their own
CREATE POLICY "tenant_select_policy" ON "Tenant"
  FOR SELECT
  USING (
    auth.is_super_admin() OR 
    id = auth.get_user_tenant_id()
  );

-- Only super admins can insert new tenants
CREATE POLICY "tenant_insert_policy" ON "Tenant"
  FOR INSERT
  WITH CHECK (auth.is_super_admin());

-- Super admins can update all tenants, cowork admins can update their own
CREATE POLICY "tenant_update_policy" ON "Tenant"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR 
    (auth.is_cowork_admin() AND id = auth.get_user_tenant_id())
  );

-- Only super admins can delete tenants
CREATE POLICY "tenant_delete_policy" ON "Tenant"
  FOR DELETE
  USING (auth.is_super_admin());

-- ============================================================================
-- USER TABLE POLICIES
-- ============================================================================

-- Users can see users from their tenant, super admins see all
CREATE POLICY "user_select_policy" ON "User"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Cowork admins and super admins can create users in their tenant
CREATE POLICY "user_insert_policy" ON "User"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR 
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Users can update their own profile, admins can update users in their tenant
CREATE POLICY "user_update_policy" ON "User"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.user_belongs_to_tenant(tenant_id) AND (
      supabase_id = auth.uid()::text OR
      auth.is_cowork_admin()
    ))
  );

-- Only admins can delete users
CREATE POLICY "user_delete_policy" ON "User"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- CLIENT TABLE POLICIES
-- ============================================================================

-- Users can see clients from their tenant
CREATE POLICY "client_select_policy" ON "Client"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Cowork admins can manage clients in their tenant
CREATE POLICY "client_insert_policy" ON "Client"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "client_update_policy" ON "Client"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "client_delete_policy" ON "Client"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- QUOTATION TABLE POLICIES
-- ============================================================================

-- Users can see quotations from their tenant
CREATE POLICY "quotation_select_policy" ON "Quotation"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Cowork admins can manage quotations in their tenant
CREATE POLICY "quotation_insert_policy" ON "Quotation"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "quotation_update_policy" ON "Quotation"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "quotation_delete_policy" ON "Quotation"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- QUOTATION ITEM TABLE POLICIES
-- ============================================================================

-- Users can see quotation items through quotation tenant relationship
CREATE POLICY "quotation_item_select_policy" ON "QuotationItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Quotation" q 
      WHERE q.id = quotation_id 
      AND auth.user_belongs_to_tenant(q.tenant_id)
    )
  );

-- Cowork admins can manage quotation items in their tenant
CREATE POLICY "quotation_item_insert_policy" ON "QuotationItem"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Quotation" q 
      WHERE q.id = quotation_id 
      AND auth.user_belongs_to_tenant(q.tenant_id)
    ))
  );

CREATE POLICY "quotation_item_update_policy" ON "QuotationItem"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Quotation" q 
      WHERE q.id = quotation_id 
      AND auth.user_belongs_to_tenant(q.tenant_id)
    ))
  );

CREATE POLICY "quotation_item_delete_policy" ON "QuotationItem"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Quotation" q 
      WHERE q.id = quotation_id 
      AND auth.user_belongs_to_tenant(q.tenant_id)
    ))
  );

-- ============================================================================
-- PLAN TABLE POLICIES
-- ============================================================================

-- Users can see plans from their tenant
CREATE POLICY "plan_select_policy" ON "Plan"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Cowork admins can manage plans in their tenant
CREATE POLICY "plan_insert_policy" ON "Plan"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "plan_update_policy" ON "Plan"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "plan_delete_policy" ON "Plan"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- SPACE TABLE POLICIES
-- ============================================================================

-- Users can see spaces from their tenant
CREATE POLICY "space_select_policy" ON "Space"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Cowork admins can manage spaces in their tenant
CREATE POLICY "space_insert_policy" ON "Space"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "space_update_policy" ON "Space"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "space_delete_policy" ON "Space"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- BOOKING TABLE POLICIES
-- ============================================================================

-- Users can see bookings from their tenant, end users see only their own
CREATE POLICY "booking_select_policy" ON "Booking"
  FOR SELECT
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    )
  );

-- Users can create bookings in their tenant
CREATE POLICY "booking_insert_policy" ON "Booking"
  FOR INSERT
  WITH CHECK (
    auth.user_belongs_to_tenant(tenant_id) AND
    user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
  );

-- Users can update their own bookings, admins can update all in their tenant
CREATE POLICY "booking_update_policy" ON "Booking"
  FOR UPDATE
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    )
  );

-- Users can cancel their own bookings, admins can delete all in their tenant
CREATE POLICY "booking_delete_policy" ON "Booking"
  FOR DELETE
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    )
  );

-- ============================================================================
-- ACCESS LOG TABLE POLICIES
-- ============================================================================

-- Admins can see all access logs in their tenant, users see only their own
CREATE POLICY "access_log_select_policy" ON "AccessLog"
  FOR SELECT
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    )
  );

-- System can insert access logs (service role)
CREATE POLICY "access_log_insert_policy" ON "AccessLog"
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- Only admins can update access logs
CREATE POLICY "access_log_update_policy" ON "AccessLog"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Only super admins can delete access logs
CREATE POLICY "access_log_delete_policy" ON "AccessLog"
  FOR DELETE
  USING (auth.is_super_admin());

-- ============================================================================
-- INVOICE TABLE POLICIES
-- ============================================================================

-- Users can see invoices from their tenant, client admins see their client's invoices
CREATE POLICY "invoice_select_policy" ON "Invoice"
  FOR SELECT
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      client_id IN (
        SELECT c.id FROM "Client" c
        JOIN "User" u ON u.client_id = c.id
        WHERE u.supabase_id = auth.uid()::text
      )
    )
  );

-- Cowork admins can manage invoices in their tenant
CREATE POLICY "invoice_insert_policy" ON "Invoice"
  FOR INSERT
  WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "invoice_update_policy" ON "Invoice"
  FOR UPDATE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "invoice_delete_policy" ON "Invoice"
  FOR DELETE
  USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- ============================================================================
-- APPLY SIMILAR PATTERNS TO REMAINING TABLES
-- ============================================================================

-- Contract policies (similar to quotation)
CREATE POLICY "contract_select_policy" ON "Contract"
  FOR SELECT USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "contract_insert_policy" ON "Contract"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "contract_update_policy" ON "Contract"
  FOR UPDATE USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "contract_delete_policy" ON "Contract"
  FOR DELETE USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Membership policies
CREATE POLICY "membership_select_policy" ON "Membership"
  FOR SELECT USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "membership_insert_policy" ON "Membership"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "membership_update_policy" ON "Membership"
  FOR UPDATE USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

CREATE POLICY "membership_delete_policy" ON "Membership"
  FOR DELETE USING (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- QR Code policies
CREATE POLICY "qr_code_select_policy" ON "QRCode"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership" m 
      WHERE m.id = membership_id 
      AND auth.user_belongs_to_tenant(m.tenant_id)
    )
  );

CREATE POLICY "qr_code_insert_policy" ON "QRCode"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Membership" m 
      WHERE m.id = membership_id 
      AND auth.user_belongs_to_tenant(m.tenant_id)
    ))
  );

-- Resource policies
CREATE POLICY "resource_select_policy" ON "Resource"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Space" s 
      WHERE s.id = space_id 
      AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "resource_insert_policy" ON "Resource"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Space" s 
      WHERE s.id = space_id 
      AND auth.user_belongs_to_tenant(s.tenant_id)
    ))
  );

-- Service policies
CREATE POLICY "service_select_policy" ON "Service"
  FOR SELECT USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "service_insert_policy" ON "Service"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND auth.user_belongs_to_tenant(tenant_id))
  );

-- Visitor policies
CREATE POLICY "visitor_select_policy" ON "Visitor"
  FOR SELECT USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "visitor_insert_policy" ON "Visitor"
  FOR INSERT WITH CHECK (auth.user_belongs_to_tenant(tenant_id));

-- Payment policies
CREATE POLICY "payment_select_policy" ON "Payment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Invoice" i 
      WHERE i.id = invoice_id 
      AND auth.user_belongs_to_tenant(i.tenant_id)
    )
  );

CREATE POLICY "payment_insert_policy" ON "Payment"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Invoice" i 
      WHERE i.id = invoice_id 
      AND auth.user_belongs_to_tenant(i.tenant_id)
    ))
  );

-- Account Balance policies
CREATE POLICY "account_balance_select_policy" ON "AccountBalance"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Client" c 
      WHERE c.id = client_id 
      AND auth.user_belongs_to_tenant(c.tenant_id)
    )
  );

CREATE POLICY "account_balance_insert_policy" ON "AccountBalance"
  FOR INSERT WITH CHECK (
    auth.is_super_admin() OR
    (auth.is_cowork_admin() AND EXISTS (
      SELECT 1 FROM "Client" c 
      WHERE c.id = client_id 
      AND auth.user_belongs_to_tenant(c.tenant_id)
    ))
  ); 