import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import { putObjectBuffer } from "@/lib/s3";
import {
  extensionForContentType,
  fetchImageBytes,
  imageDimensions,
  searchStockImages,
  stockObjectKey,
  type ProviderStatus,
  type StockImage,
} from "@/lib/stock-images";

/** Where previews land inside the workspace. `refs/` is already excluded from
 * the persisted revision source, so these never reach the database. */
export const STOCK_THUMB_DIR = "refs/stock";

/** The names `allowedTools` must carry for the agent to see these tools. */
export const STOCK_TOOL_NAMES = [
  "mcp__stock__search_images",
  "mcp__stock__use_image",
] as const;

/** Workspace-relative path of one candidate's downloaded preview. */
export function thumbRelPath(
  image: Pick<StockImage, "provider" | "id">,
  contentType: string,
): string {
  const ext = extensionForContentType(contentType);
  return `${STOCK_THUMB_DIR}/${image.provider}-${image.id}.${ext}`;
}

export interface StockCandidate {
  image: StockImage;
  /** Null when the preview could not be downloaded — the agent must not guess. */
  thumbPath: string | null;
}

function providerSummary(providers: ProviderStatus[]): string {
  return providers
    .map((p) =>
      p.status === "ok" ? p.provider : `${p.provider} failed (${p.note ?? "error"})`,
    )
    .join(", ");
}

/** The candidate list exactly as the agent sees it. */
export function formatCandidates(args: {
  query: string;
  candidates: StockCandidate[];
  providers: ProviderStatus[];
}): string {
  const { query, candidates, providers } = args;
  if (providers.length === 0) {
    return [
      "Stock image search is not configured on this server",
      "(PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, PIXABAY_API_KEY are all unset).",
      "Design without stock imagery and do not call this tool again.",
    ].join(" ");
  }
  const summary = providerSummary(providers);
  if (candidates.length === 0) {
    return `No images matched "${query}" (searched: ${summary}). Try different wording — plainer nouns and a mood word usually work better than a long phrase.`;
  }

  const lines = candidates.map((candidate, index) => {
    const { image, thumbPath } = candidate;
    const preview = thumbPath
      ? `preview: ${thumbPath}`
      : "no preview (download failed)";
    return [
      `${index + 1}. ${image.provider}/${image.id} · original ${image.width}x${image.height} · ${preview}`,
      `   ${image.description}`,
    ].join("\n");
  });

  return [
    `${candidates.length} candidates for "${query}" (searched: ${summary}).`,
    "",
    ...lines,
    "",
    "Open two or three previews with Read before you decide — the descriptions",
    "say nothing about whether a photo is actually beautiful. Then call",
    "use_image with the provider and id of each one you want. It returns a",
    "permanent URL to put in <Media src>. Never put a provider URL or a preview",
    "path into the source: both stop working.",
  ].join("\n");
}

/**
 * The confirmation the agent gets after an image is mirrored.
 *
 * `stored` is the size of the file that was actually saved, which is a resized
 * derivative and always smaller than the provider's original. The agent sizes
 * <Media> from these numbers, so quoting the original here would have the image
 * optimizer upscale a file it does not have.
 */
export function formatUseResult(
  image: StockImage,
  url: string,
  stored: { width: number; height: number } | null,
): string {
  const size = stored ?? { width: image.width, height: image.height };
  return [
    `Mirrored ${image.provider}/${image.id}.`,
    `Use this URL in <Media src>: ${url}`,
    `Stored size: ${size.width}x${size.height}. Size <Media> from these numbers —`,
    "do not ask for a width or height larger than this, and prefer fill inside a",
    "sized parent for anything full-bleed.",
    `Credit — record it as a comment above the section that uses this photo: ${image.credit}`,
  ].join("\n");
}

/**
 * Unsplash's API guidelines ask for a ping to the photo's `download_location`
 * whenever a photo is actually used. Best-effort and unawaited by the caller:
 * a failure here must never fail the build.
 */
async function reportUnsplashDownload(image: StockImage): Promise<void> {
  const key = (process.env.UNSPLASH_ACCESS_KEY ?? "").trim();
  if (image.provider !== "unsplash" || !image.downloadLocation || !key) return;
  try {
    await fetch(image.downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Courtesy call only.
  }
}

function text(body: string, isError = false) {
  return { content: [{ type: "text" as const, text: body }], isError };
}

/**
 * The stock-image tools, bound to one build.
 *
 * They run in the worker process, so the provider keys and the AWS credentials
 * stay out of the agent's shell env — the agent only ever sees descriptions,
 * local preview paths, and finished S3 URLs.
 */
export function createStockServer(args: {
  workspaceDir: string;
  invitationId: string;
}) {
  // What the last search returned, so `use_image` can resolve a pick without
  // trusting a URL the model typed out from memory.
  const candidates = new Map<string, StockImage>();

  const searchTool = tool(
    "search_images",
    "Search Pexels, Unsplash and Pixabay for photography to use in this invitation. Returns candidates with a downloaded preview you can open with Read, so you can judge the images before choosing. Use it whenever the design would be stronger with a photograph the invitation does not already supply.",
    {
      query: z
        .string()
        .min(2)
        .describe(
          "What the photo should show, in English, however many words it takes: subject plus mood or palette, e.g. 'olive grove golden hour warm' or 'white peonies on linen overhead'.",
        ),
      orientation: z
        .enum(["landscape", "portrait", "square"])
        .optional()
        .describe(
          "Shape needed. A full-bleed phone background wants portrait; a wide band wants landscape.",
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("How many candidates to return. Defaults to 9."),
    },
    async ({ query, orientation, count }) => {
      const result = await searchStockImages({
        query,
        orientation,
        limit: count ?? 9,
      });

      const thumbDir = path.join(args.workspaceDir, STOCK_THUMB_DIR);
      if (result.images.length > 0) {
        await mkdir(thumbDir, { recursive: true });
      }

      const downloaded: StockCandidate[] = await Promise.all(
        result.images.map(async (image) => {
          candidates.set(`${image.provider}:${image.id}`, image);
          try {
            const { buffer, contentType } = await fetchImageBytes(image.thumbUrl, {
              maxBytes: 5 * 1024 * 1024,
            });
            const rel = thumbRelPath(image, contentType);
            await writeFile(path.join(args.workspaceDir, rel), buffer);
            return { image, thumbPath: rel };
          } catch {
            // A preview that won't download is still a usable candidate.
            return { image, thumbPath: null };
          }
        }),
      );

      return text(
        formatCandidates({
          query,
          candidates: downloaded,
          providers: result.providers,
        }),
      );
    },
  );

  const useTool = tool(
    "use_image",
    "Claim one image from the last search: it is copied to permanent storage and you get back the URL to put in <Media src>, plus the credit line to record. Call it only for images you are actually placing in the design.",
    {
      provider: z
        .enum(["pexels", "unsplash", "pixabay"])
        .describe("The provider shown in the candidate list."),
      id: z.string().min(1).describe("The id shown in the candidate list."),
    },
    async ({ provider, id }) => {
      const image = candidates.get(`${provider}:${id}`);
      if (!image) {
        return text(
          `No candidate ${provider}/${id} from this session. Run search_images first and use a provider/id it returned.`,
          true,
        );
      }
      try {
        const { buffer, contentType } = await fetchImageBytes(image.fullUrl);
        const url = await putObjectBuffer(
          stockObjectKey(args.invitationId, image, contentType),
          buffer,
          contentType,
        );
        await reportUnsplashDownload(image);
        return text(formatUseResult(image, url, imageDimensions(buffer)));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return text(
          `Could not store ${provider}/${id}: ${message}. Pick a different candidate.`,
          true,
        );
      }
    },
  );

  return createSdkMcpServer({
    name: "stock",
    version: "1.0.0",
    tools: [searchTool, useTool],
    // Two small schemas in the cacheable prefix, rather than a ToolSearch
    // round-trip before the first search. A whole extra turn re-reads the
    // session at cache-write prices; ~300 prefix tokens do not.
    alwaysLoad: true,
    // A search fans out to three APIs and then downloads nine previews. The
    // default is effectively unbounded; 90s is generous and still bounded.
    timeout: 90_000,
  });
}
