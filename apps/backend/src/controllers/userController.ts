import { Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Query users schema
const queryUsersSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('50'),
  role: z.enum(['SUPER_ADMIN', 'COWORK_ADMIN', 'CLIENT_ADMIN', 'END_USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  assignable: z.string().optional(), // Filter to only assignable users
  search: z.string().optional(),
});

class UserController {
  // GET /api/users
  async getUsers(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      console.log('=== USER CONTROLLER DEBUG ===');
      console.log('User info:', {
        userId: req.user?.id,
        email: req.user?.email,
        tenantId: req.user?.tenantId,
        role: req.user?.role
      });

      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }

      const query = queryUsersSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      console.log('Query params:', query);

      // If assignable filter is requested, only return COWORK_ADMIN and END_USER
      let roleFilter = query.role;
      if (query.assignable === 'true') {
        // Override role filter to only include assignable roles
        // We'll filter this in the service call by making multiple calls if needed
      }

      // Get users by tenant
      const result = await UserService.getUsersByTenant(
        tenantId,
        query.page,
        query.limit,
        roleFilter,
        query.status
      );

      // If assignable filter is requested, filter to only COWORK_ADMIN and END_USER
      if (query.assignable === 'true') {
        result.users = result.users.filter(user => 
          ['COWORK_ADMIN', 'END_USER'].includes(user.role)
        );
        result.total = result.users.length;
      }

      // Apply search filter if provided
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        result.users = result.users.filter(user => {
          const searchableText = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
          return searchableText.includes(searchTerm);
        });
        result.total = result.users.length;
      }

      console.log('Found users:', {
        count: result.users.length,
        total: result.total,
        assignableFilter: query.assignable,
        searchTerm: query.search,
        tenantId: tenantId,
        usersFromTenant: result.users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          status: u.status,
          tenantId: u.tenantId
        }))
      });

      console.log('=== END USER CONTROLLER ===');

      return {
        success: true,
        data: {
          users: result.users,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit)
          }
        }
      };
    }, res);
  }

  // GET /api/users/:id
  async getUserById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }

      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const user = await UserService.getUserById(id);
      
      // Verify user belongs to the same tenant
      if (!user || user.tenantId !== tenantId) {
        throw new Error('User not found or access denied');
      }

      return {
        success: true,
        data: { user }
      };
    }, res);
  }
}

export const userController = new UserController();