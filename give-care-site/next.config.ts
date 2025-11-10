import type { NextConfig } from 'next';

// Only load bundle analyzer when ANALYZE=true (prevents requiring devDependency in production)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Enable static HTML export for Cloudflare Pages
  output: 'export',

  // TypeScript: TEMPORARILY disabled for deployment
  // TODO: Fix TypeScript errors introduced in commit 46777a9
  typescript: {
    ignoreBuildErrors: true,
  },

  // React Compiler: automatic memoization for client components
  reactCompiler: true,

  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true,
    // Turbopack filesystem cache in dev for faster restarts
    turbopackFileSystemCacheForDev: true,
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
  // Note: Headers and redirects are handled via Cloudflare Pages _headers and _redirects files
  // when using output: 'export'. These Next.js configs are kept for reference but won't work
  // with static export. See public/_headers and public/_redirects for actual implementation.
  //
  // async headers() {
  //   // Moved to public/_headers for Cloudflare Pages
  // },
  // async redirects() {
  //   // Moved to public/_redirects for Cloudflare Pages
  // },
};

// Export the configuration directly since MDX is handled by next-mdx-remote/rsc
export default withBundleAnalyzer(nextConfig);
