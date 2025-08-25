/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // React strict mode
  reactStrictMode: true,
  
  // Experimental features  
  experimental: {
    // Enable server actions (object format for Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'sweetspotcowork.com', 'sweetspot-cowork.vercel.app'],
      bodySizeLimit: '2mb',
    },
    // Next.js 15 Caching optimizations
    staleTimes: {
      dynamic: 30,    // 30 seconds for dynamic routes
      static: 180,    // 3 minutes for static routes
    },
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  experimental: {
    // Optimize compilation
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu', 
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@tanstack/react-query',
      '@clerk/nextjs',
      'date-fns',
      'recharts',
      'zod'
    ],
    // Enable optimized loading
    optimizeServerReact: true,
    // Enable memory usage optimization
    memoryBasedWorkersCount: true,
    // Enable faster refresh
    webVitalsAttribution: ['CLS', 'LCP'],
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
      'sweetspot-cowork.vercel.app',
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
      // Cache static data endpoints for better performance
      {
        source: '/api/(health|metrics|stats)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      // Cache user preferences for longer
      {
        source: '/api/user/preferences',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=300, stale-while-revalidate=600',
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
      // Dashboard redirect removed - allowing direct access
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
    // Optimize bundle size and cache
    if (!dev) {
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

      // Optimize cache for better performance
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 1,
        cacheDirectory: require('path').resolve(__dirname, '.next/cache/webpack'),
        compression: 'gzip'
      }

      // Split chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Ignore specific warnings and add cache warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/encoding/ },
      /webpack\.cache\.PackFileCacheStrategy/,
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
    // Reduce bundle size with modular imports
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      },
      '@radix-ui/react-dialog': {
        transform: '@radix-ui/react-dialog/dist/{{member}}',
      },
      '@radix-ui/react-dropdown-menu': {
        transform: '@radix-ui/react-dropdown-menu/dist/{{member}}',
      },
      '@radix-ui/react-select': {
        transform: '@radix-ui/react-select/dist/{{member}}',
      },
      '@radix-ui/react-tabs': {
        transform: '@radix-ui/react-tabs/dist/{{member}}',
      },
      'date-fns': {
        transform: 'date-fns/{{member}}',
      },
      'recharts': {
        transform: 'recharts/es6/{{member}}',
      },
      lodash: {
        transform: 'lodash/{{member}}',
      },
    },
    // Optimize CSS
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
              "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https: https://*.clerk.accounts.dev",
              "worker-src 'self' blob:",
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