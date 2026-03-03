import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@vymanage/ui', '@vymanage/vyos-client'],
};

export default nextConfig;
