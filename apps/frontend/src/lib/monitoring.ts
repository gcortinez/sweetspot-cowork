/**
 * Monitoring and logging utilities for SweetSpot Cowork
 * Provides structured logging, metrics collection, and performance monitoring
 */

interface LogContext {
  userId?: string
  tenantId?: string
  sessionId?: string
  requestId?: string
  clientId?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
}

interface MetricLabels {
  method?: string
  endpoint?: string
  status?: string
  tenantId?: string
  operation?: string
  [key: string]: string | undefined
}

class Logger {
  private context: LogContext = {}

  constructor(context?: LogContext) {
    if (context) {
      this.context = context
    }
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context }
  }

  private formatMessage(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(data && { data }),
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }

    return logEntry
  }

  private sendToLoggingService(logEntry: any) {
    // Integration with external logging services
    if (process.env.LOG_SERVICE_URL) {
      fetch(process.env.LOG_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_SERVICE_KEY}`,
        },
        body: JSON.stringify(logEntry),
      }).catch(err => {
        console.error('Failed to send log to external service:', err)
      })
    }

    // Send to console in development or as fallback
    const logLevel = logEntry.level.toUpperCase()
    const message = `[${logEntry.timestamp}] ${logLevel}: ${logEntry.message}`
    
    switch (logEntry.level) {
      case 'error':
        console.error(message, logEntry)
        break
      case 'warn':
        console.warn(message, logEntry)
        break
      case 'info':
        console.info(message, logEntry)
        break
      case 'debug':
        if (process.env.LOG_LEVEL === 'debug') {
          console.debug(message, logEntry)
        }
        break
      default:
        console.log(message, logEntry)
    }
  }

  debug(message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.formatMessage('debug', message, data)
    }
  }

  info(message: string, data?: any) {
    this.formatMessage('info', message, data)
  }

  warn(message: string, data?: any) {
    this.formatMessage('warn', message, data)
  }

  error(message: string, error?: Error | any) {
    const errorData = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message, 
          stack: error.stack 
        }
      : error

    this.formatMessage('error', message, errorData)
  }

  // Business logic specific logging
  userAction(action: string, userId: string, data?: any) {
    this.setContext({ userId, action })
    this.info(`User action: ${action}`, data)
  }

  apiCall(method: string, endpoint: string, duration: number, status: number, data?: any) {
    this.info(`API call: ${method} ${endpoint}`, {
      duration,
      status,
      ...data,
    })
  }

  businessEvent(event: string, data?: any) {
    this.info(`Business event: ${event}`, data)
  }

  securityEvent(event: string, data?: any) {
    this.warn(`Security event: ${event}`, data)
  }

  performanceEvent(event: string, data?: any) {
    this.info(`Performance event: ${event}`, data)
  }
}

class Metrics {
  private static instance: Metrics
  private metrics: Map<string, any> = new Map()

  static getInstance(): Metrics {
    if (!Metrics.instance) {
      Metrics.instance = new Metrics()
    }
    return Metrics.instance
  }

  // Counter metrics
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1) {
    const key = this.getMetricKey(name, labels)
    const current = this.metrics.get(key) || 0
    this.metrics.set(key, current + value)

    // Send to metrics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetric('counter', name, value, labels)
    }
  }

  // Histogram metrics for timing data
  recordHistogram(name: string, value: number, labels: MetricLabels = {}) {
    const key = this.getMetricKey(name, labels)
    let histogram = this.metrics.get(key)
    
    if (!histogram) {
      histogram = {
        count: 0,
        sum: 0,
        buckets: new Map(),
      }
      this.metrics.set(key, histogram)
    }

    histogram.count++
    histogram.sum += value

    // Define buckets for histogram
    const buckets = [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    buckets.forEach(bucket => {
      if (value <= bucket) {
        const bucketCount = histogram.buckets.get(bucket) || 0
        histogram.buckets.set(bucket, bucketCount + 1)
      }
    })

    if (process.env.NODE_ENV === 'production') {
      this.sendMetric('histogram', name, value, labels)
    }
  }

  // Gauge metrics for current values
  setGauge(name: string, value: number, labels: MetricLabels = {}) {
    const key = this.getMetricKey(name, labels)
    this.metrics.set(key, value)

    if (process.env.NODE_ENV === 'production') {
      this.sendMetric('gauge', name, value, labels)
    }
  }

  private getMetricKey(name: string, labels: MetricLabels): string {
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',')
    
    return labelString ? `${name}{${labelString}}` : name
  }

  private sendMetric(type: string, name: string, value: number, labels: MetricLabels) {
    if (process.env.METRICS_SERVICE_URL) {
      const metric = {
        type,
        name,
        value,
        labels,
        timestamp: Date.now(),
      }

      fetch(process.env.METRICS_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.METRICS_SERVICE_KEY}`,
        },
        body: JSON.stringify(metric),
      }).catch(err => {
        console.error('Failed to send metric:', err)
      })
    }
  }

  // Business-specific metrics
  recordUserAction(action: string, userId: string, tenantId?: string) {
    this.incrementCounter('user_actions_total', {
      action,
      tenantId: tenantId || 'unknown',
    })
  }

  recordApiCall(method: string, endpoint: string, status: string, duration: number, tenantId?: string) {
    this.incrementCounter('http_requests_total', {
      method,
      endpoint,
      status,
      tenantId: tenantId || 'unknown',
    })

    this.recordHistogram('http_request_duration_seconds', duration / 1000, {
      method,
      endpoint,
      tenantId: tenantId || 'unknown',
    })
  }

  recordDatabaseQuery(operation: string, duration: number, tenantId?: string) {
    this.incrementCounter('db_queries_total', {
      operation,
      tenantId: tenantId || 'unknown',
    })

    this.recordHistogram('db_query_duration_seconds', duration / 1000, {
      operation,
      tenantId: tenantId || 'unknown',
    })
  }

  recordBusinessEvent(event: string, tenantId?: string) {
    this.incrementCounter('business_events_total', {
      event,
      tenantId: tenantId || 'unknown',
    })
  }

  // System metrics
  recordMemoryUsage(usage: number) {
    this.setGauge('memory_usage_bytes', usage)
  }

  recordCacheOperation(operation: string, hit: boolean) {
    this.incrementCounter('cache_operations_total', {
      operation,
      result: hit ? 'hit' : 'miss',
    })
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    const lines: string[] = []

    for (const [key, value] of this.metrics.entries()) {
      if (typeof value === 'number') {
        lines.push(`${key} ${value}`)
      } else if (value.count !== undefined) {
        // Histogram
        lines.push(`${key}_count ${value.count}`)
        lines.push(`${key}_sum ${value.sum}`)
        
        for (const [bucket, count] of value.buckets.entries()) {
          const bucketKey = key.replace('}', `,le="${bucket}"}`)
          lines.push(`${bucketKey}_bucket ${count}`)
        }
      }
    }

    return lines.join('\n')
  }
}

class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  static startTimer(name: string): string {
    const timerId = `${name}_${Date.now()}_${Math.random()}`
    this.timers.set(timerId, performance.now())
    return timerId
  }

  static endTimer(timerId: string, labels?: MetricLabels): number {
    const startTime = this.timers.get(timerId)
    if (!startTime) {
      throw new Error(`Timer ${timerId} not found`)
    }

    const duration = performance.now() - startTime
    this.timers.delete(timerId)

    // Record the timing metric
    const metrics = Metrics.getInstance()
    const [name] = timerId.split('_')
    metrics.recordHistogram(`${name}_duration_milliseconds`, duration, labels)

    return duration
  }

  static async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    labels?: MetricLabels
  ): Promise<T> {
    const timerId = this.startTimer(name)
    try {
      const result = await fn()
      this.endTimer(timerId, labels)
      return result
    } catch (error) {
      this.endTimer(timerId, { ...labels, error: 'true' })
      throw error
    }
  }

  static measure<T>(
    name: string, 
    fn: () => T, 
    labels?: MetricLabels
  ): T {
    const timerId = this.startTimer(name)
    try {
      const result = fn()
      this.endTimer(timerId, labels)
      return result
    } catch (error) {
      this.endTimer(timerId, { ...labels, error: 'true' })
      throw error
    }
  }
}

// Health check utilities
class HealthCheck {
  static async checkDatabase(): Promise<boolean> {
    try {
      // Simple database connectivity check
      const { prisma } = await import('./prisma')
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  static async checkRedis(): Promise<boolean> {
    try {
      // Check Redis connectivity if available
      if (process.env.REDIS_URL) {
        // Implement Redis health check
        return true
      }
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  static async checkExternalServices(): Promise<Record<string, boolean>> {
    const services: Record<string, boolean> = {}

    // Check Supabase
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      })
      services.supabase = response.ok
    } catch (error) {
      services.supabase = false
    }

    return services
  }

  static async getSystemHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: await this.checkDatabase(),
      cache: await this.checkRedis(),
      services: await this.checkExternalServices(),
    }

    // Overall health status
    const allHealthy = health.database && 
                     health.cache && 
                     Object.values(health.services).every(Boolean)
    
    health.status = allHealthy ? 'healthy' : 'unhealthy'

    return health
  }
}

// Create singleton instances
const logger = new Logger()
const metrics = Metrics.getInstance()

export {
  Logger,
  Metrics,
  PerformanceMonitor,
  HealthCheck,
  logger,
  metrics,
}

export type {
  LogContext,
  MetricLabels,
}