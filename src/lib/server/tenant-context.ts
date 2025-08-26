// Temporary stub for tenant context to fix build
// TODO: Migrate these to Clerk-based authentication

import { currentUser } from '@clerk/nextjs/server'
import prisma from './prisma'

export async function requireAuth() {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    throw new Error('Authentication required');
  }
  return clerkUser;
}

export async function requireSuperAdmin() {
  const clerkUser = await requireAuth()
  
  // Get user role from Clerk metadata
  const privateMetadata = clerkUser.privateMetadata as any;
  const publicMetadata = clerkUser.publicMetadata as any;
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
  
  if (userRole !== 'SUPER_ADMIN') {
    throw new Error('Super Admin access required');
  }
  
  return {
    user: clerkUser,
    role: userRole
  };
}

export async function requireAdmin() {
  const clerkUser = await requireAuth()
  
  // Get user role from Clerk metadata
  const privateMetadata = clerkUser.privateMetadata as any;
  const publicMetadata = clerkUser.publicMetadata as any;
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
  
  if (!['SUPER_ADMIN', 'COWORK_ADMIN'].includes(userRole)) {
    throw new Error('Admin access required');
  }
  
  return {
    user: clerkUser,
    role: userRole
  };
}

export async function withTenantContext() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function withRole() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function getTenantPrisma() {
  // For now, return the regular prisma instance
  return prisma;
}