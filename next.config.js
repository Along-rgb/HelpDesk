/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-test.edl.com.la',
        pathname: '/helpdesk/upload/categoryicons/**',
      },
      {
        protocol: 'http',
        hostname: 'api-test.edl.com.la',
        pathname: '/helpdesk/upload/categoryicons/**',
      },
    ],
  },
}

module.exports = nextConfig
