/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14.2.x's SWC minifier emits invalid JS for the wallet chunk
  // (walletconnect + hashconnect + Hedera SDK get scope-hoisted into
  // `let n,o,r,a,n,n,n;`, which throws "Identifier 'n' has already been
  // declared" at runtime). Fall back to Terser, which minifies it correctly.
  swcMinify: false,
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30
  }
};

export default nextConfig;
