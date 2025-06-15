import { PrismaClient, Prisma } from "@prisma/client";
import { config } from "../config";
import { logger } from "../utils/logger";
import { createDefaultEncryptionMiddleware } from "./prismaEncryption";

// Create PrismaClient with event logging enabled
const createPrismaClientWithEvents = () => {
  return new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    errorFormat: "pretty",
  });
};

type PrismaClientWithEvents = ReturnType<typeof createPrismaClientWithEvents>;

// Extend PrismaClient with custom functionality
interface ExtendedPrismaClient extends PrismaClientWithEvents {
  $queryStats: {
    count: number;
    totalTime: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
  };
}

let prisma: ExtendedPrismaClient;

declare global {
  var __prisma: ExtendedPrismaClient | undefined;
}

const SLOW_QUERY_THRESHOLD = 1000; // 1 second

// Create Prisma client with custom configuration
function createPrismaClient(): ExtendedPrismaClient {
  const client = createPrismaClientWithEvents() as ExtendedPrismaClient;

  // Initialize query statistics
  client.$queryStats = {
    count: 0,
    totalTime: 0,
    slowQueries: [],
  };

  // Query event logging
  client.$on("query", (e) => {
    const duration = Number(e.duration);
    
    client.$queryStats.count++;
    client.$queryStats.totalTime += duration;

    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn("Slow query detected", {
        query: e.query,
        params: e.params,
        duration: `${duration}ms`,
        target: e.target,
      });

      // Store slow query for monitoring
      client.$queryStats.slowQueries.push({
        query: e.query,
        duration,
        timestamp: new Date(),
      });

      // Keep only last 100 slow queries
      if (client.$queryStats.slowQueries.length > 100) {
        client.$queryStats.slowQueries = client.$queryStats.slowQueries.slice(-100);
      }
    }

    // Log all queries in debug mode
    if (config.logging.level === "debug") {
      logger.debug("Database query", {
        query: e.query,
        params: e.params,
        duration: `${duration}ms`,
        target: e.target,
      });
    }
  });

  // Error event logging
  client.$on("error", (e) => {
    logger.error("Database error", {
      target: e.target,
      timestamp: e.timestamp,
    }, new Error(e.message));
  });

  // Info event logging
  client.$on("info", (e) => {
    logger.info("Database info", {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp,
    });
  });

  // Warn event logging
  client.$on("warn", (e) => {
    logger.warn("Database warning", {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp,
    });
  });

  // Add encryption middleware
  client.$use(createDefaultEncryptionMiddleware());

  return client;
}

// Initialize Prisma client with singleton pattern
if (config.environment === "production") {
  prisma = createPrismaClient();
} else {
  // In development, use global variable to prevent multiple instances
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection verified successfully");
    return true;
  } catch (error) {
    logger.error("Database connection failed", {}, error as Error);
    return false;
  }
}

// Database statistics
export function getDatabaseStats() {
  return {
    queryCount: prisma.$queryStats.count,
    totalQueryTime: prisma.$queryStats.totalTime,
    averageQueryTime: prisma.$queryStats.count > 0 
      ? prisma.$queryStats.totalTime / prisma.$queryStats.count 
      : 0,
    slowQueryCount: prisma.$queryStats.slowQueries.length,
    recentSlowQueries: prisma.$queryStats.slowQueries.slice(-10),
  };
}

// Graceful disconnection
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed gracefully");
  } catch (error) {
    logger.error("Error closing database connection", {}, error as Error);
  }
}

// Transaction wrapper with error handling and logging
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, "$on" | "$connect" | "$disconnect" | "$use" | "$transaction" | "$extends">) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  }
): Promise<T> {
  const startTime = Date.now();
  const transactionId = Math.random().toString(36).substring(2, 15);

  logger.debug("Starting transaction", { transactionId });

  try {
    const result = await prisma.$transaction(callback, {
      maxWait: options?.maxWait || 5000, // 5 seconds
      timeout: options?.timeout || 10000, // 10 seconds
      isolationLevel: options?.isolationLevel,
    }) as T;

    const duration = Date.now() - startTime;
    logger.debug("Transaction completed successfully", {
      transactionId,
      duration: `${duration}ms`,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Transaction failed", {
      transactionId,
      duration: `${duration}ms`,
    }, error as Error);
    throw error;
  }
}

// Pagination helper
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: any,
  options: PaginationOptions,
  where?: any,
  include?: any
): Promise<PaginationResult<T>> {
  const { page, limit, sortBy, sortOrder } = options;
  
  // Calculate offset
  const skip = (page - 1) * limit;
  
  // Build query options
  const queryOptions: any = {
    skip,
    take: limit,
    where,
    include,
  };

  // Add sorting if specified
  if (sortBy) {
    queryOptions.orderBy = {
      [sortBy]: sortOrder || 'asc',
    };
  }

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    model.findMany(queryOptions),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

// Soft delete helper (if your models support it)
export async function softDelete(
  model: any,
  id: string,
  userId?: string
): Promise<any> {
  const updateData: any = {
    deletedAt: new Date(),
  };

  if (userId) {
    updateData.deletedBy = userId;
  }

  return model.update({
    where: { id },
    data: updateData,
  });
}

// Restore soft deleted record
export async function restore(model: any, id: string): Promise<any> {
  return model.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });
}

// Upsert helper with better error handling
export async function safeUpsert<T>(
  model: any,
  where: any,
  create: any,
  update: any
): Promise<T> {
  try {
    return await model.upsert({
      where,
      create,
      update,
    });
  } catch (error) {
    logger.error("Upsert operation failed", {
      model: model.name,
      where,
      create,
      update,
    }, error as Error);
    throw error;
  }
}

// Batch operations helper
export async function batchUpdate<T>(
  model: any,
  updates: Array<{ where: any; data: any }>
): Promise<T[]> {
  const operations = updates.map(({ where, data }) =>
    model.update({ where, data })
  );

  return Promise.all(operations);
}

// Health check for specific tables
export async function checkTableHealth(tableName: string): Promise<{
  accessible: boolean;
  recordCount?: number;
  error?: string;
}> {
  try {
    const count = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    
    return {
      accessible: true,
      recordCount: Number((count as any)[0]?.count || 0),
    };
  } catch (error) {
    return {
      accessible: false,
      error: (error as Error).message,
    };
  }
}

// Initialize database connection and run health checks
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info("Initializing database connection...");
    
    // Check basic connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error("Failed to establish database connection");
    }

    // Run basic health checks
    const coreTableChecks = await Promise.all([
      checkTableHealth("users"),
      checkTableHealth("tenants"),
      checkTableHealth("workspaces"),
    ]);

    const failedChecks = coreTableChecks.filter(check => !check.accessible);
    if (failedChecks.length > 0) {
      logger.warn("Some database tables are not accessible", { failedChecks });
    }

    logger.info("Database initialized successfully", {
      queryCount: prisma.$queryStats.count,
      coreTablesAccessible: coreTableChecks.length - failedChecks.length,
    });
  } catch (error) {
    logger.error("Database initialization failed", {}, error as Error);
    throw error;
  }
}

export { prisma };
export default prisma;