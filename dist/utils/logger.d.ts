export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
    requestId?: string;
    userId?: string;
    tenantId?: string;
}
declare class Logger {
    private logLevel;
    constructor();
    private getLogLevelFromConfig;
    private shouldLog;
    private formatLogEntry;
    private log;
    error(message: string, context?: Record<string, any>, error?: Error): void;
    warn(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    debug(message: string, context?: Record<string, any>): void;
    logRequest(method: string, url: string, requestId?: string, userId?: string, tenantId?: string): void;
    logResponse(method: string, url: string, statusCode: number, duration: number, requestId?: string): void;
    logDatabaseOperation(operation: string, table: string, duration?: number, context?: Record<string, any>): void;
    logAuthEvent(event: string, userId?: string, tenantId?: string, context?: Record<string, any>): void;
}
export declare const logger: Logger;
export declare const logError: (message: string, context?: Record<string, any>, error?: Error) => void;
export declare const logWarn: (message: string, context?: Record<string, any>) => void;
export declare const logInfo: (message: string, context?: Record<string, any>) => void;
export declare const logDebug: (message: string, context?: Record<string, any>) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map