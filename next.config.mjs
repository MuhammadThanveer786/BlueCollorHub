/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // devIndicators block removed
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'utfs.io',
          port: '',
          pathname: '/**', // Allow any path on utfs.io
        },
      ],
    },
  };

  export default nextConfig;