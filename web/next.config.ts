import type { NextConfig } from 'next';

// BFF route handlers under src/app/api/**/*.ts already proxy to the backend
// with cookie → Authorization translation. Do NOT add a /api/* rewrite here —
// it would shadow the route handlers and forward requests to Spring with no token.
const nextConfig: NextConfig = {};

export default nextConfig;
