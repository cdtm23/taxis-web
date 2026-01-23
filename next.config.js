/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Cloudflare Pages
  output: process.env.CF_PAGES === '1' ? 'standalone' : undefined,
  
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de webpack para chunks pequeños
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Limitar tamaño máximo de chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 10000, // 10KB
        maxSize: 200000, // 200KB máximo (muy por debajo del límite de 25MB)
        cacheGroups: {
          default: false,
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
