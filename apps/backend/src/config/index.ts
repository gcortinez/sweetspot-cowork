import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || "3001", 10),
  environment: process.env.NODE_ENV || "development",
  
  // CORS configuration
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || "",
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || "10", 10),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || "60000", 10),
  },
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/gif,application/pdf").split(","),
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "combined",
  },
  
  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "86400000", 10), // 24 hours
  },
  
  // Feature flags
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER === "true" || process.env.NODE_ENV === "development",
    enableMetrics: process.env.ENABLE_METRICS === "true",
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === "true" || process.env.NODE_ENV === "development",
  },
} as const;

// Validation function to ensure required environment variables are set
export const validateConfig = (): void => {
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

export default config;