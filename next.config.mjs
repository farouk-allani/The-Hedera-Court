/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30
  }
};

export default nextConfig;
