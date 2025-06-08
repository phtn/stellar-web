/** @type {import('next').NextConfig} */
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**'
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/**' // Google user content often follows this pattern
      }
    ]
  },
  experimental: {
    // https: {
    //   key: fs.readFileSync('./certs/localhost-key.pem'),
    //   cert: fs.readFileSync('./certs/localhost-cert.pem')
    // }
  }
}

export default nextConfig
