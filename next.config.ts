import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Packages that ship native binaries or rely on `__dirname` to locate
  // companion files at runtime. Bundling them rewrites paths to a virtual
  // FS root (e.g. `/ROOT/...`) and `spawn` then fails with ENOENT. Marking
  // them external tells Next.js to leave the `require()` until runtime.
  serverExternalPackages: ["pg", "bcrypt", "ffmpeg-static"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
