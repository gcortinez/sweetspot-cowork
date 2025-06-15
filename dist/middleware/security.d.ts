import { Request, Response, NextFunction } from "express";
import { generalRateLimit, authRateLimit as enhancedAuthRateLimit, passwordResetRateLimit, adminRateLimit, exportRateLimit, bruteForcePrevention, progressiveDelay } from "./rateLimiting";
export declare const createRateLimiter: (options?: Partial<rateLimit.Options>) => import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: Function) => any;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
    optionsSuccessStatus: number;
};
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMonitoring: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipFilter: (whitelist?: string[], blacklist?: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export { generalRateLimit, enhancedAuthRateLimit, passwordResetRateLimit, adminRateLimit, exportRateLimit, bruteForcePrevention, progressiveDelay };
declare const _default: {
    createRateLimiter: (options?: Partial<rateLimit.Options>) => import("express-rate-limit").RateLimitRequestHandler;
    authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    strictRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    corsOptions: {
        origin: (origin: string | undefined, callback: Function) => any;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
        optionsSuccessStatus: number;
    };
    sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
    requestSizeLimit: (req: Request, res: Response, next: NextFunction) => void;
    securityMonitoring: (req: Request, res: Response, next: NextFunction) => void;
    ipFilter: (whitelist?: string[], blacklist?: string[]) => (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=security.d.ts.map