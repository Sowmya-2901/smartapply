import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose service role key to server-side code (not to client)
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
