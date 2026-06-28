/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.indiatravel.market' },
      { protocol: 'http', hostname: 'localhost' }
    ],
    formats: ['image/avif', 'image/webp']
  }
}

module.exports = nextConfig
