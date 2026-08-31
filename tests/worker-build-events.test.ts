import { describe, expect, it } from "vitest";

import { toBuildEvent } from "@/worker/lib/build-events";
import type { BuildEvent } from "@/worker/lib/build-events";

describe("toBuildEvent", () => {
  it("maps an assistant text message to a progress event", () => {
    const e = toBuildEvent({
      type: "assistant",
      message: { content: [{ type: "text", text: "Writing index.tsx" }] },
    });
    expect(e).toEqual({ kind: "progress", text: "Writing index.tsx" });
  });

  it("maps an assistant tool_use to a tool event", () => {
    const e = toBuildEvent({
      type: "assistant",
      message: { content: [{ type: "tool_use", name: "Bash" }] },
    });
    expect(e).toEqual({ kind: "tool", name: "Bash" });
  });

  it("maps a result message to a done event with cost", () => {
    const e = toBuildEvent({
      type: "result",
      subtype: "success",
      total_cost_usd: 1.23,
    });
    expect(e).toEqual({ kind: "result", ok: true, costUsd: 1.23 });
  });

  it("returns null for messages with no user-facing content", () => {
    expect(toBuildEvent({ type: "system" })).toBeNull();
  });
});

describe("BuildEvent union", () => {
  it("includes a draft variant carrying revisionId + slug", () => {
    const e: BuildEvent = { kind: "draft", revisionId: "r1", slug: "sofia-pedro" };
    expect(e.kind).toBe("draft");
  });

  it("includes a directions variant", () => {
    const e: BuildEvent = {
      kind: "directions",
      directions: [
        {
          id: "a",
          name: "X",
          palette: ["#000"],
          typography: "A + B",
          motion: "m",
          composition: "c",
          rationale: "r",
        },
      ],
    };
    expect(e.kind).toBe("directions");
  });
});
