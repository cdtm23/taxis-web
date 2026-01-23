/** @type {import('next').NextConfig} */
const nextConfig = {
  // DESACTIVAR output: 'export' - usar SSR normal
  output: 'standalone',
  
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
