import { NextRequest, NextResponse } from 'next/server'
import { metrics } from '@/lib/monitoring'

/**
 * Prometheus metrics endpoint
 * Exports application metrics in Prometheus format
 */
export async function GET(request: NextRequest) {
  try {
    // Check if request has proper authorization for metrics access
    const authHeader = request.headers.get('authorization')
    const apiKey = request.nextUrl.searchParams.get('key')
    
    // In production, require authentication for metrics endpoint
    if (process.env.NODE_ENV === 'production') {
      const expectedKey = process.env.METRICS_API_KEY
      
      if (!expectedKey) {
        return NextResponse.json(
          { error: 'Metrics endpoint not configured' },
          { status: 503 }
        )
      }
      
      if (!apiKey || apiKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    // Generate Prometheus-formatted metrics
    const prometheusMetrics = metrics.exportPrometheusMetrics()
    
    // Add some basic Node.js metrics
    const nodeMetrics = await getNodeMetrics()
    const allMetrics = `${prometheusMetrics}\n${nodeMetrics}`
    
    return new NextResponse(allMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Metrics export failed:', error)
    
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    )
  }
}

async function getNodeMetrics(): Promise<string> {
  const metrics: string[] = []
  
  // Process metrics
  const memUsage = process.memoryUsage()
  metrics.push(`# HELP process_resident_memory_bytes Resident memory size in bytes`)
  metrics.push(`# TYPE process_resident_memory_bytes gauge`)
  metrics.push(`process_resident_memory_bytes ${memUsage.rss}`)
  
  metrics.push(`# HELP process_heap_bytes Process heap size in bytes`)
  metrics.push(`# TYPE process_heap_bytes gauge`)
  metrics.push(`process_heap_bytes ${memUsage.heapUsed}`)
  
  metrics.push(`# HELP process_heap_total_bytes Process heap total size in bytes`)
  metrics.push(`# TYPE process_heap_total_bytes gauge`)
  metrics.push(`process_heap_total_bytes ${memUsage.heapTotal}`)
  
  // Uptime
  metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`)
  metrics.push(`# TYPE process_uptime_seconds counter`)
  metrics.push(`process_uptime_seconds ${process.uptime()}`)
  
  // Current timestamp
  metrics.push(`# HELP sweetspot_scrape_timestamp_seconds Timestamp of this scrape`)
  metrics.push(`# TYPE sweetspot_scrape_timestamp_seconds gauge`)
  metrics.push(`sweetspot_scrape_timestamp_seconds ${Date.now() / 1000}`)
  
  // Version info
  metrics.push(`# HELP sweetspot_build_info Build information`)
  metrics.push(`# TYPE sweetspot_build_info gauge`)
  metrics.push(`sweetspot_build_info{version="${process.env.npm_package_version || 'unknown'}",node_version="${process.version}"} 1`)
  
  return metrics.join('\n')
}