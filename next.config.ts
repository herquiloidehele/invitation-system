import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Pin the Next image optimizer to THIS app's exact S3 bucket host. A
// wildcard like `**.amazonaws.com` turns /_next/image into an open resize
// proxy for ANY S3 bucket on AWS — an unauthenticated path that lets a
// stranger make sharp decode an arbitrary, potentially huge remote image
// into hundreds of MB of off-heap RGBA. Deriving the host from the same env
// the app uploads with keeps dev and prod correct without hardcoding.
const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3ImagePatterns =
  s3Bucket && s3Region
    ? [
        {
          protocol: "https" as const,
          hostname: `${s3Bucket}.s3.${s3Region}.amazonaws.com`,
          pathname: "/**",
        },
      ]
    : [];

const nextConfig: NextConfig = {
  // Packages that ship native binaries or rely on `__dirname` to locate
  // companion files at runtime. Bundling them rewrites paths to a virtual
  // FS root (e.g. `/ROOT/...`) and `spawn` then fails with ENOENT. Marking
  // them external tells Next.js to leave the `require()` until runtime.
  serverExternalPackages: ["pg", "bcrypt", "ffmpeg-static"],
  // Disable Next's in-process ISR/fetch LRU (default 50 MB). The on-disk
  // cache under .next/cache still works; this just stops duplicating it in
  // RSS, which is pure overhead on the memory-tight 1 GB Railway tier.
  cacheMaxMemorySize: 0,
  experimental: {
    // Convert barrel imports (e.g. `import { motion } from "framer-motion"`)
    // into direct module imports at compile time so unused exports are
    // tree-shaken. Cuts ~200-400 KB off the per-page client bundle on this
    // codebase. Safe for any package that re-exports from a barrel and
    // does not depend on side effects in the barrel itself.
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@base-ui/react",
    ],
    // Don't eagerly load every one of the ~60 app routes into memory at
    // boot (Next 16 defaults this to true). Public traffic only ever hits a
    // handful; each route now loads lazily on first request instead, trading
    // a one-off sub-second latency on a cold route for a lower baseline RSS.
    preloadEntriesOnStart: false,
    // Cap the image optimizer's sharp parallelism. Each concurrent
    // optimization decodes a full-resolution original into off-heap RGBA, so
    // unbounded concurrency on a large host multiplies peak memory. Image
    // traffic is ~1% of requests here, so capping throughput is harmless.
    imgOptConcurrency: 2,
    // Cap the source resolution sharp will decode. Next's default is ~268 MP
    // (a ~1 GB RGBA decode). Every legitimate source here is far smaller —
    // uploads are client-capped at 2560px, video posters at ~4K (8 MP),
    // Unsplash at ≤900px — so 26 MP (5120²) clears them all with margin
    // while bounding a hostile/oversized decode to ~105 MB.
    imgOptMaxInputPixels: 26_214_400,
  },
  images: {
    remotePatterns: [
      ...s3ImagePatterns,
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
