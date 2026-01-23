// Configuración específica para Cloudflare Pages
module.exports = {
  // Limita el tamaño máximo de chunks
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      // Configuración optimizada para Cloudflare
      config.optimization.splitChunks = {
        chunks: 'async',
        minSize: 20000,
        maxSize: 244000, // 244KB máximo (Cloudflare Pages permite hasta 25MB, pero queremos chunks pequeños)
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
            name(module) {
              // Divide por paquete npm
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `npm.${packageName.replace('@', '')}`;
            },
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

