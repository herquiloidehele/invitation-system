import { describe, expect, it } from "vitest";

import { parseSseFrames } from "@/lib/ai-build-stream";

describe("parseSseFrames", () => {
  it("extracts complete data frames and keeps the trailing partial", () => {
    const { events, rest } = parseSseFrames(
      'data: {"kind":"tool","name":"Bash"}\n\ndata: {"kind":"result"',
    );
    expect(events).toEqual([{ kind: "tool", name: "Bash" }]);
    expect(rest).toBe('data: {"kind":"result"');
  });

  it("parses multiple frames and skips non-data lines", () => {
    const { events } = parseSseFrames(
      ': comment\n\ndata: {"kind":"draft","revisionId":"r1","slug":"s"}\n\n',
    );
    expect(events).toEqual([{ kind: "draft", revisionId: "r1", slug: "s" }]);
  });
});
