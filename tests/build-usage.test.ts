import { describe, expect, it } from "vitest";

import { toBuildEvent, usageFromResult } from "@/worker/lib/build-events";

const result = {
  type: "result",
  subtype: "success",
  total_cost_usd: 0.42,
  // The SDK's real ModelUsage shape: camelCase, cumulative per model.
  modelUsage: {
    "claude-opus-5": {
      inputTokens: 1200,
      outputTokens: 9000,
      cacheCreationInputTokens: 2300,
      cacheReadInputTokens: 41000,
      costUSD: 0.4,
    },
    "claude-haiku-4-5": {
      inputTokens: 300,
      outputTokens: 20,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      costUSD: 0.02,
    },
  },
};

describe("usageFromResult", () => {
  it("sums across models and names the one that did the writing", () => {
    expect(usageFromResult(result)).toEqual({
      model: "claude-opus-5",
      inputTokens: 1500,
      outputTokens: 9020,
      cacheReadTokens: 41000,
      cacheWriteTokens: 2300,
    });
  });

  it("also reads the raw snake_case apiUsage form", () => {
    expect(
      usageFromResult({
        modelUsage: {
          "claude-sonnet-5": {
            apiUsage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 1 },
          },
        },
      }),
    ).toEqual({ model: "claude-sonnet-5", inputTokens: 10, outputTokens: 5, cacheReadTokens: 100, cacheWriteTokens: 1 });
  });

  it("returns null when there is no usage", () => {
    expect(usageFromResult({ type: "result", subtype: "success" })).toBeNull();
  });
});

describe("result event", () => {
  it("carries the usage", () => {
    const e = toBuildEvent(result);
    expect(e).toMatchObject({ kind: "result", ok: true, costUsd: 0.42 });
    expect((e as { usage?: unknown }).usage).toMatchObject({ model: "claude-opus-5" });
  });
});
