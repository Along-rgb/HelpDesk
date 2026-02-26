/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-test.edl.com.la',
        pathname: '/helpdesk/upload/categoryicon/**',
      },
      {
        protocol: 'http',
        hostname: 'api-test.edl.com.la',
        pathname: '/helpdesk/upload/categoryicon/**',
      },
    ],
  },
}

module.exports = nextConfig
