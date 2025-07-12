import { NextRequest, NextResponse } from 'next/server'
import { HealthCheck } from '@/lib/monitoring'

/**
 * Health check endpoint for monitoring and load balancing
 * Returns application health status and system information
 */
export async function GET(request: NextRequest) {
  try {
    const health = await HealthCheck.getSystemHealth()
    
    const status = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(health, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  }
}

// Also respond to HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const health = await HealthCheck.getSystemHealth()
    const status = health.status === 'healthy' ? 200 : 503
    
    return new NextResponse(null, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  } catch (error) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  }
}