/**
 * Centralized logging utility for the invitation system
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  userId?: string
  email?: string
  invitationId?: string
  tenantId?: string
  operation?: string
  [key: string]: any
}

class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = this.getLogPrefix(level)
    
    let logMessage = `${prefix} [${timestamp}] ${message}`
    
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
      logMessage += ` | ${contextStr}`
    }
    
    return logMessage
  }

  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍'
      case LogLevel.INFO:
        return '📋'
      case LogLevel.WARN:
        return '⚠️'
      case LogLevel.ERROR:
        return '❌'
      default:
        return '📋'
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context))
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context))
  }

  public error(message: string, error?: Error | any, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const fullContext = {
      ...context,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }
    
    console.error(this.formatMessage(LogLevel.ERROR, message, fullContext))
  }

  // Invitation-specific logging methods
  public logInvitationCreated(email: string, role: string, tenantId?: string, invitationId?: string): void {
    this.info('Invitation created', {
      operation: 'create_invitation',
      email,
      role,
      tenantId,
      invitationId
    })
  }

  public logInvitationAccepted(email: string, userId: string, invitationCount: number): void {
    this.info('Invitation accepted', {
      operation: 'accept_invitation',
      email,
      userId,
      invitationCount
    })
  }

  public logInvitationSynced(email: string, status: string): void {
    this.info('Invitation synced', {
      operation: 'sync_invitation',
      email,
      status
    })
  }

  public logInvitationCleaned(email: string, reason: string): void {
    this.info('Invitation cleaned', {
      operation: 'cleanup_invitation',
      email,
      reason
    })
  }

  public logWebhookReceived(type: string, userId?: string, email?: string): void {
    this.info('Webhook received', {
      operation: 'webhook_received',
      webhookType: type,
      userId,
      email
    })
  }

  public logWebhookProcessed(type: string, success: boolean, userId?: string): void {
    if (success) {
      this.info('Webhook processed successfully', {
        operation: 'webhook_processed',
        webhookType: type,
        userId
      })
    } else {
      this.error('Webhook processing failed', undefined, {
        operation: 'webhook_processed',
        webhookType: type,
        userId
      })
    }
  }

  public logAPICall(endpoint: string, method: string, userId?: string): void {
    this.debug('API call', {
      operation: 'api_call',
      endpoint,
      method,
      userId
    })
  }

  public logAPIResponse(endpoint: string, method: string, success: boolean, duration?: number): void {
    this.debug('API response', {
      operation: 'api_response',
      endpoint,
      method,
      success,
      duration: duration ? `${duration}ms` : undefined
    })
  }
}

export const logger = Logger.getInstance()