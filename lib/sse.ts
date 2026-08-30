/** Format a value as a single SSE `data:` frame. */
export function formatSseEvent(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Split an NDJSON buffer into parsed objects plus the trailing partial line.
 * Blank and unparseable lines are skipped. Feed `rest` back with the next chunk.
 */
export function parseNdjsonLines(buffer: string): {
  events: unknown[];
  rest: string;
} {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events: unknown[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // ignore non-JSON (human logs interleaved)
    }
  }
  return { events, rest };
}
