import { spawn } from "node:child_process";
import path from "node:path";
import { NextRequest } from "next/server";

import { formatSseEvent, parseNdjsonLines } from "@/lib/sse";
import { classifyBuildError, extractStderrMessage } from "@/lib/build-errors";

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
  // Directions gate options. `direction` is the card the admin picked;
  // `refineDirections` asks for another round of proposals.
  const direction = (body as { direction?: unknown }).direction ?? null;
  const rawRefine = (body as { refineDirections?: unknown }).refineDirections;
  const refineDirections = typeof rawRefine === "string" ? rawRefine : null;

  const encoder = new TextEncoder();
  const repoRoot = process.cwd();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // The tsx binary directly, not via `npx`: npx resolution measured at
      // 0.12–0.47s of pure overhead per build.
      const child = spawn(
        path.join(repoRoot, "node_modules", ".bin", "tsx"),
        [
          path.join("worker", "build-invitation-ndjson.ts"),
          slug,
          prompt,
          JSON.stringify({ direction, refineDirections }),
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

      // Once a specific cause has been reported, the generic non-zero exit is
      // just noise on top of it.
      let reportedError = false;

      child.stderr.on("data", (chunk: Buffer) => {
        // Worker stderr is a developer diagnostic — a raw Node stack trace in
        // the admin chat is noise. Extract the one meaningful line and explain
        // it, so "Credit balance is too low" becomes actionable guidance.
        const summary = extractStderrMessage(chunk.toString("utf8"));
        if (!summary) return;
        const info = classifyBuildError(summary);
        reportedError = true;
        send({
          kind: "error",
          message: info.title,
          hint: info.hint,
          detail: info.detail,
        });
      });

      const finish = () => {
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      child.on("error", (err) => {
        const info = classifyBuildError(err.message);
        reportedError = true;
        send({
          kind: "error",
          message: info.title,
          hint: info.hint,
          detail: info.detail,
        });
        finish();
      });

      child.on("close", (code) => {
        // Flush any final buffered line.
        const { events } = parseNdjsonLines(buffer + "\n");
        for (const e of events) send(e);
        // Only report the bare exit code when nothing more specific was said —
        // otherwise it stacks a meaningless second error under the real one.
        if (code !== 0 && !reportedError) {
          send({
            kind: "error",
            message: "A construção falhou",
            hint: "Tente novamente; se persistir, verifique os registos do servidor.",
            detail: `Worker exited with code ${code}.`,
          });
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
