/** @type {import('next').NextConfig} */
const imageHost = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME || '';
const nextConfig = {
  images: {
    remotePatterns: imageHost
      ? [
          { protocol: 'https', hostname: imageHost, pathname: '/helpdesk/upload/categoryicon/**' },
          { protocol: 'http', hostname: imageHost, pathname: '/helpdesk/upload/categoryicon/**' },
        ]
      : [],
  },
};

module.exports = nextConfig;
