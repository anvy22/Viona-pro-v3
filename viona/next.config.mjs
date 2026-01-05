/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog'
    ]
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          recharts: {
            name: 'recharts',
            chunks: 'async',
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            priority: 30,
          },
          lucide: {
            name: 'lucide',
            chunks: 'async', 
            test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
            priority: 25,
          },
          ui: {
            name: 'ui',
            chunks: 'async',
            test: /[\\/]components[\\/]ui[\\/]/,
            priority: 20,
          }
        }
      };
    }
    return config;
  },

  swcMinify: true,
  
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'res.cloudinary.com',
      'dxbyd5wae.cloudinary.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dxbyd5wae.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
};

export default nextConfig;
