import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Packages that ship native binaries or rely on `__dirname` to locate
  // companion files at runtime. Bundling them rewrites paths to a virtual
  // FS root (e.g. `/ROOT/...`) and `spawn` then fails with ENOENT. Marking
  // them external tells Next.js to leave the `require()` until runtime.
  serverExternalPackages: ["pg", "bcrypt", "ffmpeg-static"],
  // Convert barrel imports (e.g. `import { motion } from "framer-motion"`)
  // into direct module imports at compile time so unused exports are
  // tree-shaken. Cuts ~200-400 KB off the per-page client bundle on this
  // codebase. Safe for any package that re-exports from a barrel and
  // does not depend on side effects in the barrel itself.
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@base-ui/react",
    ],
  },
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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "brindealstudio.up.railway.app" }],
        destination: "https://convites.brindealstudio.com/:path*",
        permanent: true,
      },
    ];
  },
  // Static videos in /public are versioned by filename (e.g. `-v1`), so the
  // bytes at a given path never change — cache them forever. Ship a new clip
  // by bumping the filename (and its reference) rather than overwriting.
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
