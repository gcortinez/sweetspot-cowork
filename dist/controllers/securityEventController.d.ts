import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const getSecurityEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSecurityEventStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const resolveSecurityEvent: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUnresolvedEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCriticalEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getFailedLogins: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const detectThreats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEventsByIP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserSecurityEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSecurityDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=securityEventController.d.ts.map