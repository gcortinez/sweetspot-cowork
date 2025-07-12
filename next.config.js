/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // React strict mode
  reactStrictMode: true,
  
  // Experimental features
  experimental: {
    // Enable server actions (object format for Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'sweetspotcowork.com'],
      bodySizeLimit: '2mb',
    },
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Public runtime config (available to client)
  publicRuntimeConfig: {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  },

  // Server runtime config (server-side only)
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'sweetspotcowork.com',
      'cdn.sweetspotcowork.com',
      // Supabase storage domain
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || '',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Generate ETags for pages
  generateEtags: true,

  // Custom headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // Rewrites for API routing
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      // Bundle analyzer in production builds
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze/client.html',
          })
        )
      }

      // Optimize imports
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      }
    }

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/encoding/ },
    ]

    return config
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by CI/CD, skip during build for faster builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Linting is handled by CI/CD, skip during build for faster builds
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // PoweredByHeader
  poweredByHeader: false,


  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Monitoring
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Reduce bundle size
    modularizeImports: {
      lodash: {
        transform: 'lodash/{{member}}',
      },
      '@mui/material': {
        transform: '@mui/material/{{member}}',
      },
      '@mui/icons-material': {
        transform: '@mui/icons-material/{{member}}',
      },
    },
  }),
}

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  const originalHeaders = nextConfig.headers
  nextConfig.headers = async () => {
    const baseHeaders = await originalHeaders()
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          ...baseHeaders[0]?.headers || [],
        ],
      },
    ]
  }
}

module.exports = nextConfig 