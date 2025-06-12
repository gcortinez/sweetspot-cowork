# Row Level Security (RLS) Implementation

This document describes the comprehensive Row Level Security implementation for SweetSpot Cowork's multi-tenant architecture.

## Overview

Row Level Security (RLS) ensures complete data isolation between tenants while maintaining a single database instance. Each tenant can only access their own data, with role-based permissions controlling what operations users can perform.

## Architecture

### 4-Level User Hierarchy

1. **SUPER_ADMIN**: Can access all tenants and perform any operation
2. **COWORK_ADMIN**: Can manage all data within their assigned tenant
3. **CLIENT_ADMIN**: Can view and manage their client's data within the tenant
4. **END_USER**: Can access their own bookings and basic tenant information

### Core Components

- **RLS Policies**: Database-level security rules that filter data based on user context
- **Helper Functions**: PostgreSQL functions that extract user information from JWT tokens
- **Middleware**: Express.js middleware for authentication and tenant context validation
- **Utility Functions**: TypeScript utilities for managing tenant operations

## Database Schema Security

### Tables with RLS Enabled

All tables in the system have RLS enabled:

```sql
-- Core tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Business logic tables
ALTER TABLE "Quotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Space" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
-- ... and all other tables
```

### Helper Functions

#### JWT Token Extraction

```sql
-- Get tenant ID from JWT claims
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'tenant_id',
    (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role from JWT claims
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'role',
    (auth.jwt() -> 'user_metadata' ->> 'role')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Permission Checks

```sql
-- Check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user belongs to a specific tenant
CREATE OR REPLACE FUNCTION auth.user_belongs_to_tenant(tenant_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.is_super_admin() OR auth.get_user_tenant_id() = tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Policy Examples

### Tenant Table Policies

```sql
-- Super admins can see all tenants, others can only see their own
CREATE POLICY "tenant_select_policy" ON "Tenant"
  FOR SELECT
  USING (
    auth.is_super_admin() OR 
    id = auth.get_user_tenant_id()
  );

-- Only super admins can create new tenants
CREATE POLICY "tenant_insert_policy" ON "Tenant"
  FOR INSERT
  WITH CHECK (auth.is_super_admin());
```

### User Table Policies

```sql
-- Users can see users from their tenant, super admins see all
CREATE POLICY "user_select_policy" ON "User"
  FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

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
```

### Booking Table Policies

```sql
-- Users can see bookings from their tenant, end users see only their own
CREATE POLICY "booking_select_policy" ON "Booking"
  FOR SELECT
  USING (
    auth.user_belongs_to_tenant(tenant_id) AND (
      auth.is_cowork_admin() OR
      user_id = (SELECT id FROM "User" WHERE supabase_id = auth.uid()::text)
    )
  );
```

## Backend Implementation

### Tenant Context Extraction

```typescript
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
  clientId?: string;
}

export const getTenantContext = async (accessToken: string): Promise<TenantContext | null> => {
  // Extract user information from Supabase token
  // Query User table to get tenant and role information
  // Return structured context for use in application logic
};
```

### Express Middleware

```typescript
// Authenticate and extract tenant context
export const authenticateAndExtractTenant = [
  authenticateToken,
  extractTenantContext
];

// Validate access to specific tenant
export const validateTenantParam = (paramName: string = 'tenantId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate user has access to the requested tenant
  };
};

// Require specific roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user has required role
  };
};
```

### User Management

```typescript
// Create user with proper tenant context
export const createUserWithTenant = async (
  email: string,
  password: string,
  tenantId: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  clientId?: string
) => {
  // Create user in Supabase Auth with metadata
  // Create user record in User table
  // Set up proper tenant relationships
};
```

## Security Features

### Data Isolation

- **Tenant-level isolation**: Each tenant's data is completely isolated
- **Role-based access**: Users can only perform operations allowed by their role
- **Cross-tenant protection**: No user can access data from other tenants (except SUPER_ADMIN)

### Access Control Matrix

| Role | Tenant Access | User Management | Client Management | Financial Data | Bookings |
|------|---------------|-----------------|-------------------|----------------|----------|
| SUPER_ADMIN | All tenants | All users | All clients | All data | All bookings |
| COWORK_ADMIN | Own tenant | Tenant users | Tenant clients | Tenant data | Tenant bookings |
| CLIENT_ADMIN | Own tenant (read) | Own client users | Own client | Own client data | Own client bookings |
| END_USER | Own tenant (read) | Own profile | - | Own invoices | Own bookings |

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "user_metadata": {
    "tenant_id": "tenant-uuid",
    "role": "COWORK_ADMIN",
    "client_id": "client-uuid"
  }
}
```

## API Route Protection

### Example Protected Routes

```typescript
// Tenant-specific routes
router.get('/tenants/:tenantId/users', 
  authenticateWithTenantValidation('tenantId'),
  requireAdmin,
  getUsersController
);

// User-specific routes
router.get('/users/:userId/profile',
  authenticateAndExtractTenant,
  requireUserAccess,
  getUserProfileController
);

// Client-specific routes
router.get('/clients/:clientId/invoices',
  authenticateAndExtractTenant,
  requireClientAccess,
  getClientInvoicesController
);
```

## Testing RLS Policies

### Manual Testing Steps

1. **Create test tenants and users**:
   ```sql
   INSERT INTO "Tenant" (name, slug, status) VALUES 
   ('Test Tenant A', 'test-a', 'ACTIVE'),
   ('Test Tenant B', 'test-b', 'ACTIVE');
   ```

2. **Create users with different roles**:
   ```typescript
   await createUserWithTenant(
     'admin@testa.com',
     'password',
     tenantAId,
     'COWORK_ADMIN',
     'Admin',
     'User'
   );
   ```

3. **Test data access**:
   - Login as each user
   - Attempt to access data from different tenants
   - Verify only appropriate data is returned

### Automated Testing

```typescript
// Test RLS policies programmatically
export const testRLSPolicies = async (accessToken: string) => {
  const userClient = createUserClient(accessToken);
  
  // Test various table access
  const tenants = await userClient.from('tenants').select('*');
  const users = await userClient.from('users').select('*');
  const clients = await userClient.from('clients').select('*');
  
  return { tenants, users, clients };
};
```

## Troubleshooting

### Common Issues

1. **RLS Policy Violation (PGRST301)**:
   - Check if user has proper tenant_id in JWT metadata
   - Verify RLS policies are correctly implemented
   - Ensure user belongs to the tenant they're trying to access

2. **Missing Tenant Context**:
   - Verify JWT token includes user_metadata with tenant_id
   - Check if user record exists in User table
   - Ensure Supabase Auth user is properly linked

3. **Permission Denied**:
   - Verify user role allows the requested operation
   - Check if middleware is properly validating permissions
   - Ensure RLS policies match application logic

### Debugging Tools

```typescript
// Log tenant context for debugging
console.log('Tenant Context:', await getTenantContext(accessToken));

// Test specific RLS policy
const result = await testRLSPolicies(accessToken);
console.log('RLS Test Results:', result);
```

## Migration and Deployment

### Applying RLS Policies

1. **Run the RLS migration**:
   ```bash
   cd apps/backend
   npm run db:push
   ```

2. **Verify policies are active**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Test with different user roles**:
   - Create test users with different roles
   - Verify data isolation is working correctly

### Production Considerations

- **Performance**: RLS policies add overhead to queries - monitor performance
- **Indexing**: Ensure tenant_id columns are properly indexed
- **Monitoring**: Set up alerts for RLS policy violations
- **Backup**: Test backup and restore procedures with RLS enabled

## Security Best Practices

1. **Always use RLS**: Never bypass RLS policies in application code
2. **Validate tokens**: Always verify JWT tokens on the backend
3. **Principle of least privilege**: Give users minimum required permissions
4. **Regular audits**: Periodically review and test RLS policies
5. **Monitor access**: Log and monitor data access patterns
6. **Secure metadata**: Protect JWT user metadata from tampering

## Conclusion

The RLS implementation provides robust multi-tenant data isolation while maintaining performance and flexibility. The combination of database-level policies, middleware validation, and utility functions ensures that tenant data remains secure and properly isolated throughout the application. 