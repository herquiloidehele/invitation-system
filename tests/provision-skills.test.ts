import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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

describe("provisionWorkspace — stock previews", () => {
  it("clears last turn's stock previews so they cannot pile up or go stale", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "prov-"));
    const stale = path.join(dir, "refs", "stock", "pexels-1.jpg");
    await mkdir(path.dirname(stale), { recursive: true });
    await writeFile(stale, "old bytes");

    await provisionWorkspace(dir, DTS);

    await expect(readFile(stale, "utf8")).rejects.toThrow();
  });

  it("leaves the rest of refs/ alone — attachments live there too", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "prov-"));
    const attachment = path.join(dir, "refs", "moodboard.png");
    await mkdir(path.dirname(attachment), { recursive: true });
    await writeFile(attachment, "keep me");

    await provisionWorkspace(dir, DTS);

    expect(await readFile(attachment, "utf8")).toBe("keep me");
  });
});
