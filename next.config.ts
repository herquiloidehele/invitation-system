import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
