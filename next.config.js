/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOVEE_API_KEY: process.env.GOVEE_API_KEY,
    HOME_PROXY_URL: process.env.HOME_PROXY_URL,
    HOME_PROXY_SECRET: process.env.HOME_PROXY_SECRET,
  },
}

module.exports = nextConfig
