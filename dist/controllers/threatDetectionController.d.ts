import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const analyzeBehavior: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserBehaviorProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const detectSecurityPatterns: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const predictThreats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const analyzeSecurityEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSecurityAlerts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const resolveSecurityAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateThreatDetectionConfig: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getThreatDetectionConfig: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getThreatStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=threatDetectionController.d.ts.map