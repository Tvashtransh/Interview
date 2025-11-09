/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
    NEXT_PUBLIC_ML_API_URL: process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig

