/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Production optimizations (swcMinify is default in Next.js 14+)
  compress: true,

  // Handle images from external sources
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_APP_NAME: '10X Accountability Coach',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Webpack configuration for production
  webpack: (config, { isServer }) => {
    // Handle node modules that need special treatment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      }
    }
    return config
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Output configuration for deployment
  // Note: 'standalone' is not needed for Vercel (it optimizes automatically)
  // Only enable standalone for self-hosted deployments
  // output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  // TypeScript configuration
  typescript: {
    // Don't fail build on type errors in production (we check separately)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't fail build on lint errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
