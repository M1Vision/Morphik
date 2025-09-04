import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for postgres and other Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        child_process: false,
      };
    }
    return config;
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
