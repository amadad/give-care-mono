/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static HTML export for Cloudflare Pages
  output: 'export',

  // Enable React Strict Mode (recommended)
  reactStrictMode: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
