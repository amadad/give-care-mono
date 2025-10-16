import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable static HTML export for Cloudflare Pages
  output: 'export',

  // Skip TypeScript type checking during build
  // (type checking is done separately in development)
  typescript: {
    ignoreBuildErrors: true,
  },

  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true,
    optimizePackageImports: [
      'framer-motion',
      '@heroicons/react',
      'react-icons',
      'date-fns',
    ],
  },

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.7.33'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      // HSTS only in production
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            },
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.hotjar.com wss://*.hotjar.com",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'"
              ].join('; ')
            }
          ]
        }
      ] : [])
    ]
  },
  async redirects() {
    return [
      {
        source: '/news',
        destination: '/words',
        permanent: true,
      },
      {
        source: '/news/:slug*',
        destination: '/words/:slug*',
        permanent: true,
      },
    ]
  },
};

// Export the configuration directly since MDX is handled by next-mdx-remote/rsc
module.exports = withBundleAnalyzer(nextConfig);
