import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { provisionWorkspace } from "@/worker/provision";

const DTS = 'declare module "@platform" { export const useRsvp: unknown; }';

describe("provisionWorkspace — skills", () => {
  it("writes all three skills the agent is allowed to invoke", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "prov-"));
    await provisionWorkspace(dir, DTS);

    const read = (name: string) =>
      readFile(path.join(dir, ".claude", "skills", name, "SKILL.md"), "utf8");

    expect(await read("platform")).toContain("name: platform");
    expect(await read("design-process")).toContain("name: design-process");
    expect(await read("phone-craft")).toContain("name: phone-craft");
  });
});
