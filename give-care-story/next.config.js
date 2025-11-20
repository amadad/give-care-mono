/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static HTML export for Cloudflare Pages
  output: 'export',

  // Enable React Strict Mode (recommended)
  reactStrictMode: true,

  // React Compiler: automatic memoization for client components
  reactCompiler: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  experimental: {
    // Turbopack filesystem cache in dev for faster restarts
    // Note: Turbopack disabled for production builds due to static export + Google Fonts issues
    turbopackFileSystemCacheForDev: true,
  },
};

module.exports = nextConfig;
