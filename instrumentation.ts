// Next.js 15 instrumentation for performance monitoring
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime, not Edge
    console.log('🔧 Instrumentation: Server performance monitoring enabled')
    
    // Setup performance monitoring
    const { PerformanceObserver } = await import('perf_hooks')
    
    // Monitor Next.js specific metrics
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.startsWith('next-')) {
          console.log(`⚡ Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
        }
        
        // Log slow operations
        if (entry.duration > 1000) {
          console.warn(`🐌 Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
        }
      }
    })
    
    obs.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
    
    // Setup memory monitoring in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const used = process.memoryUsage()
        const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100
        
        console.log('💾 Memory usage:', {
          rss: `${formatMB(used.rss)}MB`,
          heapUsed: `${formatMB(used.heapUsed)}MB`,
          heapTotal: `${formatMB(used.heapTotal)}MB`,
          external: `${formatMB(used.external)}MB`,
        })
      }, 30000) // Every 30 seconds
    }
  }
}