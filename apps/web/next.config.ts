import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@appdistillery/core',
    '@appdistillery/database',
    '@appdistillery/ui',
  ],
};

export default nextConfig;
