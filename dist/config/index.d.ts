export declare const config: {
    readonly port: number;
    readonly environment: string;
    readonly frontend: {
        readonly url: string;
    };
    readonly database: {
        readonly url: string;
        readonly maxConnections: number;
        readonly connectionTimeout: number;
    };
    readonly supabase: {
        readonly url: string;
        readonly serviceRoleKey: string;
        readonly anonKey: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshExpiresIn: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly upload: {
        readonly maxFileSize: number;
        readonly allowedMimeTypes: string[];
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
    };
    readonly security: {
        readonly bcryptRounds: number;
        readonly sessionTimeout: number;
    };
    readonly features: {
        readonly enableSwagger: boolean;
        readonly enableMetrics: boolean;
        readonly enableDebugRoutes: boolean;
    };
};
export declare const validateConfig: () => void;
export default config;
//# sourceMappingURL=index.d.ts.map