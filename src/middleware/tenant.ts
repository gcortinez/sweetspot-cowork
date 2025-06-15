import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
  tenantId?: string;
}

export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Get tenant from user
    const tenantId = req.user.tenantId;
    
    if (!tenantId) {
      throw new AppError('No tenant associated with user', 400);
    }

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        status: 'ACTIVE',
      },
    });

    if (!tenant) {
      throw new AppError('Tenant not found or inactive', 404);
    }

    // Set tenant context
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    next(error);
  }
};