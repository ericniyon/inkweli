import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(process.cwd()),
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.png" }];
  },
};

export default nextConfig;
