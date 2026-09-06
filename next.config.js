/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.cache = false;
    config.parallelism = 1;
    return config;
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

module.exports = nextConfig;
