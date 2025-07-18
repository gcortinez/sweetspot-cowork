import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// Client-side auth types and interfaces
export type { AuthUser, UserRole } from "@/types/database";

// Server-side auth context
export interface TenantContext {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    tenantId: string | null
  }
  tenantId: string | null
  effectiveTenantId: string | null
  isSuper: boolean
}

// Helper function to get user with tenant info for server actions
// For Super Admins, they can optionally pass a tenantId to operate on a specific cowork
export async function getTenantContext(targetTenantId?: string): Promise<TenantContext> {
  const user = await currentUser()
  
  if (!user) {
    throw new Error('No autorizado - no hay usuario de Clerk')
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { 
      id: true, 
      tenantId: true, 
      role: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  if (!dbUser) {
    // Try to find by email as fallback
    const userByEmail = await db.user.findFirst({
      where: { 
        email: user.emailAddresses[0]?.emailAddress 
      },
      select: { 
        id: true, 
        tenantId: true, 
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        clerkId: true
      }
    })
    
    if (userByEmail && !userByEmail.clerkId) {
      // Update the user with clerkId
      const updatedUser = await db.user.update({
        where: { id: userByEmail.id },
        data: { clerkId: user.id },
        select: { 
          id: true, 
          tenantId: true, 
          role: true,
          firstName: true,
          lastName: true,
          email: true
        }
      })
      
      return {
        user: updatedUser,
        tenantId: updatedUser.tenantId,
        effectiveTenantId: updatedUser.role === 'SUPER_ADMIN' ? targetTenantId || null : updatedUser.tenantId,
        isSuper: updatedUser.role === 'SUPER_ADMIN'
      }
    }
    
    throw new Error(`Usuario no encontrado en la base de datos. Clerk ID: ${user.id}, Email: ${user.emailAddresses[0]?.emailAddress}`)
  }

  // Super Admins don't have a tenantId, which is expected
  if (!dbUser.tenantId && dbUser.role !== 'SUPER_ADMIN') {
    throw new Error(`Usuario no tiene un tenant asignado. User ID: ${dbUser.id}, Email: ${dbUser.email}`)
  }

  return {
    user: dbUser,
    tenantId: dbUser.tenantId,
    effectiveTenantId: dbUser.role === 'SUPER_ADMIN' ? targetTenantId || null : dbUser.tenantId,
    isSuper: dbUser.role === 'SUPER_ADMIN'
  }
}
