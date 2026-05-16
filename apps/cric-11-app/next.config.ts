import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cricket/state", "@cricket/api-client", "@cricket/ui", "@cricket/tables"],
};

export default nextConfig;
