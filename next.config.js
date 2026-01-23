/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración específica para Cloudflare
  experimental: {
    // Habilita SWC minify (más eficiente)
    swcMinify: true,
  },
  compiler: {
    // Elimina console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
