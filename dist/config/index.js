"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || "3001", 10),
    environment: process.env.NODE_ENV || "development",
    frontend: {
        url: process.env.FRONTEND_URL || "http://localhost:3000",
    },
    database: {
        url: process.env.DATABASE_URL || "",
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || "10", 10),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || "60000", 10),
    },
    supabase: {
        url: process.env.SUPABASE_URL || "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        anonKey: process.env.SUPABASE_ANON_KEY || "",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "dev-secret-key",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/gif,application/pdf").split(","),
    },
    logging: {
        level: process.env.LOG_LEVEL || "info",
        format: process.env.LOG_FORMAT || "combined",
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "86400000", 10),
    },
    features: {
        enableSwagger: process.env.ENABLE_SWAGGER === "true" || process.env.NODE_ENV === "development",
        enableMetrics: process.env.ENABLE_METRICS === "true",
        enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === "true" || process.env.NODE_ENV === "development",
    },
};
const validateConfig = () => {
    const required = [
        "DATABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    console.log("✅ Environment configuration validated successfully");
};
exports.validateConfig = validateConfig;
exports.default = exports.config;
//# sourceMappingURL=index.js.map