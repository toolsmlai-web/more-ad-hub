/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['supabase.co', 'avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig