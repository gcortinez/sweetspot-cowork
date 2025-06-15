"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.getDatabaseStats = getDatabaseStats;
exports.disconnectDatabase = disconnectDatabase;
exports.withTransaction = withTransaction;
exports.paginate = paginate;
exports.softDelete = softDelete;
exports.restore = restore;
exports.safeUpsert = safeUpsert;
exports.batchUpdate = batchUpdate;
exports.checkTableHealth = checkTableHealth;
exports.initializeDatabase = initializeDatabase;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const prismaEncryption_1 = require("./prismaEncryption");
let prisma;
const SLOW_QUERY_THRESHOLD = 1000;
function createPrismaClient() {
    const client = new client_1.PrismaClient({
        log: [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "info" },
            { emit: "event", level: "warn" },
        ],
        datasources: {
            db: {
                url: config_1.config.database.url,
            },
        },
        errorFormat: "pretty",
    });
    client.$queryStats = {
        count: 0,
        totalTime: 0,
        slowQueries: [],
    };
    client.$on("query", (e) => {
        const duration = Number(e.duration);
        client.$queryStats.count++;
        client.$queryStats.totalTime += duration;
        if (duration > SLOW_QUERY_THRESHOLD) {
            logger_1.logger.warn("Slow query detected", {
                query: e.query,
                params: e.params,
                duration: `${duration}ms`,
                target: e.target,
            });
            client.$queryStats.slowQueries.push({
                query: e.query,
                duration,
                timestamp: new Date(),
            });
            if (client.$queryStats.slowQueries.length > 100) {
                client.$queryStats.slowQueries = client.$queryStats.slowQueries.slice(-100);
            }
        }
        if (config_1.config.logging.level === "debug") {
            logger_1.logger.debug("Database query", {
                query: e.query,
                params: e.params,
                duration: `${duration}ms`,
                target: e.target,
            });
        }
    });
    client.$on("error", (e) => {
        logger_1.logger.error("Database error", {
            target: e.target,
            timestamp: e.timestamp,
        }, new Error(e.message));
    });
    client.$on("info", (e) => {
        logger_1.logger.info("Database info", {
            message: e.message,
            target: e.target,
            timestamp: e.timestamp,
        });
    });
    client.$on("warn", (e) => {
        logger_1.logger.warn("Database warning", {
            message: e.message,
            target: e.target,
            timestamp: e.timestamp,
        });
    });
    client.$use((0, prismaEncryption_1.createDefaultEncryptionMiddleware)());
    return client;
}
if (config_1.config.environment === "production") {
    exports.prisma = prisma = createPrismaClient();
}
else {
    if (!global.__prisma) {
        global.__prisma = createPrismaClient();
    }
    exports.prisma = prisma = global.__prisma;
}
async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info("Database connection verified successfully");
        return true;
    }
    catch (error) {
        logger_1.logger.error("Database connection failed", {}, error);
        return false;
    }
}
function getDatabaseStats() {
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
async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        logger_1.logger.info("Database connection closed gracefully");
    }
    catch (error) {
        logger_1.logger.error("Error closing database connection", {}, error);
    }
}
async function withTransaction(callback, options) {
    const startTime = Date.now();
    const transactionId = Math.random().toString(36).substring(2, 15);
    logger_1.logger.debug("Starting transaction", { transactionId });
    try {
        const result = await prisma.$transaction(callback, {
            maxWait: options?.maxWait || 5000,
            timeout: options?.timeout || 10000,
            isolationLevel: options?.isolationLevel,
        });
        const duration = Date.now() - startTime;
        logger_1.logger.debug("Transaction completed successfully", {
            transactionId,
            duration: `${duration}ms`,
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error("Transaction failed", {
            transactionId,
            duration: `${duration}ms`,
        }, error);
        throw error;
    }
}
async function paginate(model, options, where, include) {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const queryOptions = {
        skip,
        take: limit,
        where,
        include,
    };
    if (sortBy) {
        queryOptions.orderBy = {
            [sortBy]: sortOrder || 'asc',
        };
    }
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
async function softDelete(model, id, userId) {
    const updateData = {
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
async function restore(model, id) {
    return model.update({
        where: { id },
        data: {
            deletedAt: null,
            deletedBy: null,
        },
    });
}
async function safeUpsert(model, where, create, update) {
    try {
        return await model.upsert({
            where,
            create,
            update,
        });
    }
    catch (error) {
        logger_1.logger.error("Upsert operation failed", {
            model: model.name,
            where,
            create,
            update,
        }, error);
        throw error;
    }
}
async function batchUpdate(model, updates) {
    const operations = updates.map(({ where, data }) => model.update({ where, data }));
    return Promise.all(operations);
}
async function checkTableHealth(tableName) {
    try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        return {
            accessible: true,
            recordCount: Number(count[0]?.count || 0),
        };
    }
    catch (error) {
        return {
            accessible: false,
            error: error.message,
        };
    }
}
async function initializeDatabase() {
    try {
        logger_1.logger.info("Initializing database connection...");
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
            throw new Error("Failed to establish database connection");
        }
        const coreTableChecks = await Promise.all([
            checkTableHealth("users"),
            checkTableHealth("tenants"),
            checkTableHealth("workspaces"),
        ]);
        const failedChecks = coreTableChecks.filter(check => !check.accessible);
        if (failedChecks.length > 0) {
            logger_1.logger.warn("Some database tables are not accessible", { failedChecks });
        }
        logger_1.logger.info("Database initialized successfully", {
            queryCount: prisma.$queryStats.count,
            coreTablesAccessible: coreTableChecks.length - failedChecks.length,
        });
    }
    catch (error) {
        logger_1.logger.error("Database initialization failed", {}, error);
        throw error;
    }
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map