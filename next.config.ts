import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensures these stay on the server in RSC (moved from experimental in Next.js 15)
  serverExternalPackages: ['postgres', 'drizzle-orm', 'pg'],
  webpack: (config, { isServer }) => {
    // Webpack fallbacks (for non-Turbopack builds)
    if (!isServer) {
      Object.assign(config.resolve.fallback ??= {}, {
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        child_process: false,
        postgres: false,
        pg: false,
      });
    }
    return config;
  },
};

export default nextConfig;
