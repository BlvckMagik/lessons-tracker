import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: false,
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default withPWA(nextConfig);
