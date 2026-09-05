import type { BuildEvent } from "@/worker/lib/build-events";

/**
 * Parse an SSE buffer into BuildEvents plus the trailing partial frame. Frames
 * are separated by a blank line; the payload is the `data:` line's JSON. Feed
 * `rest` back with the next chunk.
 */
export function parseSseFrames(buffer: string): {
  events: BuildEvent[];
  rest: string;
} {
  const chunks = buffer.split("\n\n");
  const rest = chunks.pop() ?? "";
  const events: BuildEvent[] = [];
  for (const chunk of chunks) {
    const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
    if (!dataLine) continue;
    const json = dataLine.slice("data:".length).trim();
    if (!json) continue;
    try {
      events.push(JSON.parse(json) as BuildEvent);
    } catch {
      // ignore malformed frame
    }
  }
  return { events, rest };
}
