import { spawn } from "node:child_process";
import path from "node:path";
import { NextRequest } from "next/server";

import { formatSseEvent, parseNdjsonLines } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * Kick off an AI invitation build and stream progress as Server-Sent Events.
 * Auth is enforced upstream by the proxy (valid JWT required for /api/admin/*).
 *
 * The heavy lifting — Claude Agent SDK run + esbuild + S3 publish — happens in a
 * spawned worker (`worker/build-invitation-ndjson.ts`) that emits typed events
 * as NDJSON on stdout. We parse those lines and re-frame them as SSE. The child
 * is intentionally NOT killed on client disconnect: the build is paid work and
 * finishes (publishing its revision) even if the admin closes the tab.
 */
export async function POST(req: NextRequest) {
  let body: { slug?: unknown; prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!slug || !prompt) {
    return jsonError("Both 'slug' and 'prompt' are required.", 400);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("ANTHROPIC_API_KEY is not configured.", 500);
  }

  const encoder = new TextEncoder();
  const repoRoot = process.cwd();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn(
        "npx",
        [
          "tsx",
          path.join("worker", "build-invitation-ndjson.ts"),
          slug,
          prompt,
        ],
        { cwd: repoRoot, env: process.env },
      );

      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(formatSseEvent(event)));
        } catch {
          // controller already closed (client gone); ignore.
        }
      };

      let buffer = "";
      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const { events, rest } = parseNdjsonLines(buffer);
        buffer = rest;
        for (const e of events) send(e);
      });

      child.stderr.on("data", (chunk: Buffer) => {
        // Surface worker diagnostics as progress rather than failing the stream.
        send({ kind: "progress", text: chunk.toString("utf8").trimEnd() });
      });

      const finish = () => {
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      child.on("error", (err) => {
        send({ kind: "error", message: `Worker failed to start: ${err.message}` });
        finish();
      });

      child.on("close", (code) => {
        // Flush any final buffered line.
        const { events } = parseNdjsonLines(buffer + "\n");
        for (const e of events) send(e);
        if (code !== 0) {
          send({ kind: "error", message: `Worker exited with code ${code}.` });
        }
        finish();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
