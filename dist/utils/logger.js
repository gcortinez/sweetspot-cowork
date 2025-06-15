"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logInfo = exports.logWarn = exports.logError = exports.logger = exports.LogLevel = void 0;
const config_1 = require("../config");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    logLevel;
    constructor() {
        this.logLevel = this.getLogLevelFromConfig();
    }
    getLogLevelFromConfig() {
        switch (config_1.config.logging.level.toLowerCase()) {
            case "error":
                return LogLevel.ERROR;
            case "warn":
                return LogLevel.WARN;
            case "info":
                return LogLevel.INFO;
            case "debug":
                return LogLevel.DEBUG;
            default:
                return LogLevel.INFO;
        }
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatLogEntry(entry) {
        const timestamp = entry.timestamp;
        const level = LogLevel[entry.level];
        const message = entry.message;
        let logString = `[${timestamp}] ${level}: ${message}`;
        if (entry.requestId) {
            logString += ` | RequestID: ${entry.requestId}`;
        }
        if (entry.userId) {
            logString += ` | UserID: ${entry.userId}`;
        }
        if (entry.tenantId) {
            logString += ` | TenantID: ${entry.tenantId}`;
        }
        if (entry.context && Object.keys(entry.context).length > 0) {
            logString += ` | Context: ${JSON.stringify(entry.context)}`;
        }
        if (entry.error) {
            logString += ` | Error: ${entry.error.message}`;
            if (entry.error.stack && this.logLevel >= LogLevel.DEBUG) {
                logString += `\nStack: ${entry.error.stack}`;
            }
        }
        return logString;
    }
    log(level, message, context, error) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
        };
        const logString = this.formatLogEntry(entry);
        switch (level) {
            case LogLevel.ERROR:
                console.error(logString);
                break;
            case LogLevel.WARN:
                console.warn(logString);
                break;
            case LogLevel.INFO:
                console.info(logString);
                break;
            case LogLevel.DEBUG:
                console.debug(logString);
                break;
        }
    }
    error(message, context, error) {
        this.log(LogLevel.ERROR, message, context, error);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    logRequest(method, url, requestId, userId, tenantId) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `${method} ${url}`,
            requestId,
            userId,
            tenantId,
        };
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatLogEntry(entry));
        }
    }
    logResponse(method, url, statusCode, duration, requestId) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `${method} ${url} - ${statusCode} (${duration}ms)`,
            requestId,
        };
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatLogEntry(entry));
        }
    }
    logDatabaseOperation(operation, table, duration, context) {
        const message = duration
            ? `DB ${operation} on ${table} (${duration}ms)`
            : `DB ${operation} on ${table}`;
        this.debug(message, context);
    }
    logAuthEvent(event, userId, tenantId, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `Auth: ${event}`,
            context,
            userId,
            tenantId,
        };
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatLogEntry(entry));
        }
    }
}
exports.logger = new Logger();
const logError = (message, context, error) => {
    exports.logger.error(message, context, error);
};
exports.logError = logError;
const logWarn = (message, context) => {
    exports.logger.warn(message, context);
};
exports.logWarn = logWarn;
const logInfo = (message, context) => {
    exports.logger.info(message, context);
};
exports.logInfo = logInfo;
const logDebug = (message, context) => {
    exports.logger.debug(message, context);
};
exports.logDebug = logDebug;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map