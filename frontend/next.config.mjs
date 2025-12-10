/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async rewrites() {
    // In production (App Runner), use the backend URL from environment
    // In development, use localhost
    const backendUrl = process.env.BACKEND_URL || 
                      process.env.NEXT_PUBLIC_API_URL || 
                      (process.env.NODE_ENV === 'production' 
                        ? 'https://pqykjsmmab.us-east-1.awsapprunner.com' 
                        : 'http://localhost:8000');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  // Ensure proper production build
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

