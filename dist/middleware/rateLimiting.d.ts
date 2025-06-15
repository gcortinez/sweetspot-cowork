import { Request, Response } from 'express';
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const progressiveDelay: import("express-rate-limit").RateLimitRequestHandler;
export declare const bruteForcePrevention: (req: Request, res: Response, next: Function) => Promise<any>;
export declare const resetBruteForceCounters: (email: string, ip: string) => void;
export declare const adminRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const exportRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createCustomRateLimit: (options: {
    windowMs: number;
    max: number;
    message: string;
    skipSuccessfulRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const isRateLimited: (ip: string, key: string) => boolean;
export declare const cleanup: () => void;
declare global {
    namespace Express {
        interface Request {
            bruteForceInfo?: {
                ipAttempts: number;
                emailAttempts: number;
                ipKey: string;
                emailKey: string;
            };
        }
    }
}
//# sourceMappingURL=rateLimiting.d.ts.map