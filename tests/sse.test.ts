import { describe, expect, it } from "vitest";

import { formatSseEvent, parseNdjsonLines } from "@/lib/sse";

describe("formatSseEvent", () => {
  it("serializes to a data: line terminated by a blank line", () => {
    expect(formatSseEvent({ kind: "tool", name: "Bash" })).toBe(
      'data: {"kind":"tool","name":"Bash"}\n\n',
    );
  });
});

describe("parseNdjsonLines", () => {
  it("returns complete JSON objects and the trailing partial", () => {
    const { events, rest } = parseNdjsonLines('{"a":1}\n{"b":2}\n{"c":');
    expect(events).toEqual([{ a: 1 }, { b: 2 }]);
    expect(rest).toBe('{"c":');
  });

  it("skips blank and unparseable lines", () => {
    const { events } = parseNdjsonLines('{"a":1}\n\nnot json\n{"b":2}\n');
    expect(events).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("carries an empty rest when the buffer ends on a newline", () => {
    const { rest } = parseNdjsonLines('{"a":1}\n');
    expect(rest).toBe("");
  });
});
