// Temporary stub for tenant context to fix build
// TODO: Migrate these to Clerk-based authentication

export async function requireAuth() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function requireAdmin() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function withTenantContext() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function getTenantPrisma() {
  throw new Error('Not implemented - migrate to Clerk');
}