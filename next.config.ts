import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // This is what I want to see
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: ["https://9003-firebase-space-weather-1757614222465.cluster-y3k7ko3fang56qzieg3trwgyfg.cloudworkstations.dev", "*"],
  }
};

export default nextConfig;
