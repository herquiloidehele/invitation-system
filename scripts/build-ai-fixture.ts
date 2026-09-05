import { build } from "esbuild";
import path from "node:path";

/**
 * Builds the Phase 1 fixture bundle exactly the way the Phase 3 worker will
 * build generated code: IIFE, React/framer-motion aliased to shims that borrow
 * the host's instances, self-registering under a bundle id.
 *
 * Usage: npx tsx scripts/build-ai-fixture.ts <bundle-id>
 */
const bundleId = process.argv[2];
if (!bundleId) {
  console.error("Usage: npx tsx scripts/build-ai-fixture.ts <bundle-id>");
  process.exit(1);
}

const root = process.cwd();

build({
  entryPoints: [path.join(root, "fixtures/ai-bundle/index.tsx")],
  outfile: path.join(root, "public/ai-bundles/fixture.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  minify: true,
  alias: {
    react: path.join(root, "fixtures/ai-bundle/shims/react.ts"),
    "react/jsx-runtime": path.join(
      root,
      "fixtures/ai-bundle/shims/jsx-runtime.ts",
    ),
    "framer-motion": path.join(root, "fixtures/ai-bundle/shims/framer-motion.ts"),
    "@platform": path.join(root, "fixtures/ai-bundle/shims/platform.ts"),
  },
  define: {
    __FIXTURE_BUNDLE_ID__: JSON.stringify(bundleId),
  },
})
  .then(() => {
    console.log(`Built public/ai-bundles/fixture.js for bundle id "${bundleId}"`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
