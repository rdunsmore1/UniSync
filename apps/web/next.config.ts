import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unisync/ui", "@unisync/types"],
};

export default nextConfig;
