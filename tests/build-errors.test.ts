import { describe, expect, it } from "vitest";

import {
  classifyBuildError,
  extractStderrMessage,
  isFatalAgentText,
} from "@/lib/build-errors";

describe("extractStderrMessage", () => {
  it("keeps the real error out of a Node stack dump", () => {
    const raw = `
/Users/x/node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs:99
;k2(n).then(()=>{
 ^

Credit balance is too low
    at responseCallbacks.<computed> (/Users/x/node_modules/y.js:884:9)
Node.js v22.22.3
`;
    expect(extractStderrMessage(raw)).toBe("Credit balance is too low");
  });

  it("drops minified source lines", () => {
    const raw =
      "`;k2(n).then(()=>{if(t!==void 0){let s=dNe(n);if(s!==null)t.append(s,[{data:o}]).catch(()=>{});return}";
    expect(extractStderrMessage(raw)).toBeNull();
  });

  it("returns null for pure noise", () => {
    expect(extractStderrMessage("\n  \n   at foo (/a/node_modules/b.js:1:1)\n")).toBeNull();
  });
});

describe("classifyBuildError", () => {
  it("explains an exhausted balance", () => {
    const e = classifyBuildError("Credit balance is too low");
    expect(e.title).toMatch(/crédito/i);
    expect(e.hint).toBeTruthy();
  });

  it("explains a missing or invalid key", () => {
    expect(classifyBuildError("Not logged in · Please run /login").title).toMatch(
      /chave/i,
    );
  });

  it("explains a rate limit", () => {
    expect(classifyBuildError("429 rate_limit_error").title).toMatch(/limite/i);
  });

  it("falls back to a generic title, keeping the raw text as detail", () => {
    const e = classifyBuildError("Something odd happened");
    expect(e.title).toMatch(/falhou/i);
    expect(e.detail).toBe("Something odd happened");
  });
});

describe("isFatalAgentText", () => {
  it("recognises fatal SDK text surfaced as assistant prose", () => {
    expect(isFatalAgentText("Credit balance is too low")).toBe(true);
    expect(isFatalAgentText("Not logged in · Please run /login")).toBe(true);
  });

  it("leaves ordinary progress text alone", () => {
    expect(isFatalAgentText("Build passes; dist/bundle.js updated.")).toBe(false);
  });
});
