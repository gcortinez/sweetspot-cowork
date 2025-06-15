import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const getAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAuditLogStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const exportAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEntityAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const cleanupAuditLogs: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=auditLogController.d.ts.map