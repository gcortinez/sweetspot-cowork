import { config } from "../config";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
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

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.getLogLevelFromConfig();
  }

  private getLogLevelFromConfig(): LogLevel {
    switch (config.logging.level.toLowerCase()) {
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

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
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

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
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

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Request-specific logging methods
  logRequest(method: string, url: string, requestId?: string, userId?: string, tenantId?: string): void {
    const entry: LogEntry = {
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

  logResponse(method: string, url: string, statusCode: number, duration: number, requestId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `${method} ${url} - ${statusCode} (${duration}ms)`,
      requestId,
    };

    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatLogEntry(entry));
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration?: number, context?: Record<string, any>): void {
    const message = duration 
      ? `DB ${operation} on ${table} (${duration}ms)`
      : `DB ${operation} on ${table}`;
    
    this.debug(message, context);
  }

  // Authentication logging
  logAuthEvent(event: string, userId?: string, tenantId?: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
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

// Create singleton instance
export const logger = new Logger();

// Export convenience methods
export const logError = (message: string, context?: Record<string, any>, error?: Error) => {
  logger.error(message, context, error);
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};

export default logger;