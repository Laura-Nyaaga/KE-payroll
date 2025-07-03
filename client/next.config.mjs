/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
     {
        protocol: process.env.NEXT_IMAGE_PROTOCOL || 'http',
        hostname: process.env.NEXT_IMAGE_HOSTNAME || 'localhost',
        port: process.env.NEXT_IMAGE_PORT || '4000',
        pathname: process.env.NEXT_IMAGE_PATHNAME || '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
