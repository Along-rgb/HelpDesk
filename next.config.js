/** @type {import('next').NextConfig} */
const imageHost = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME || '';

const nextConfig = {
  images: {
    remotePatterns: imageHost
      ? [
          {
            protocol: 'https',
            hostname: imageHost,
            // แก้ไขตรงนี้ให้เป็น /helpdesk/upload/** เพื่อให้ครอบคลุม hdFile และโฟลเดอร์อื่นๆ
            pathname: '/helpdesk/upload/**',
          },
          {
            protocol: 'http',
            hostname: imageHost,
            pathname: '/helpdesk/upload/**',
          },
        ]
      : [],
  },
};

module.exports = nextConfig;