import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy every /api/* request to the Spring Boot backend
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
