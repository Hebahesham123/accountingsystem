/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Keep true if you don't want Next Image optimization (e.g., plain static hosting)
    // Set to false (or remove) if you want Next's optimizer/CDN.
    unoptimized: true,
  },

  // ⬇️ Next 15 change: moved out of "experimental"
  serverExternalPackages: ['@supabase/supabase-js'],

  // (Optional) You can remove this whole block if you just rely on process.env at runtime.
  // NEXT_PUBLIC_* variables are automatically inlined if set in the environment.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Consistent routing
  trailingSlash: false,

  // Dev-server cache behavior; OK to keep, safe to remove if you don't need it
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
