// Forzar Node.js runtime en Cloudflare
module.exports = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};
