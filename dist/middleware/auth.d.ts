import { Request, Response, NextFunction } from "express";
import { UserRole } from "@sweetspot/shared";
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (requiredRole: UserRole) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireTenantAccess: (tenantIdParam?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireClientAccess: (clientIdParam?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireSelfAccess: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map