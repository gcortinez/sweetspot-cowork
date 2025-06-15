import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const setupTwoFactor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const enableTwoFactor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const disableTwoFactor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const verifyTwoFactor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateBackupCodes: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getTwoFactorStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkTwoFactorRequired: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=twoFactorController.d.ts.map