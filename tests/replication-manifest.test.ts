import { describe, expect, it } from "vitest";

import {
  REPLICATION_MANIFEST,
  selectReplicatedReferences,
} from "@/worker/lib/replication-manifest";

const png = { name: "reference.png", mimeType: "image/png" };
const jpg = { name: "second.JPG", mimeType: "image/jpeg" };
const pdf = { name: "brand.pdf", mimeType: "application/pdf" };
const attachments = [png, jpg, pdf];

const source = (manifest: string) => ({
  "index.tsx": "export default () => null;",
  [REPLICATION_MANIFEST]: manifest,
});

describe("selectReplicatedReferences", () => {
  it("finds nothing when the build wrote no manifest", () => {
    expect(selectReplicatedReferences({ "index.tsx": "x" }, attachments)).toEqual([]);
    expect(selectReplicatedReferences(null, attachments)).toEqual([]);
  });

  it("returns the attachments the manifest names, in manifest order", () => {
    const picked = selectReplicatedReferences(
      source("second.JPG\nreference.png"),
      attachments,
    );

    expect(picked).toEqual([jpg, png]);
  });

  it("matches a name regardless of case and surrounding markdown", () => {
    const picked = selectReplicatedReferences(
      source("# Replicated\n\n- `REFERENCE.png`\n* second.jpg\n"),
      attachments,
    );

    expect(picked).toEqual([png, jpg]);
  });

  it("skips a named file that cannot be sent as an image", () => {
    expect(selectReplicatedReferences(source("brand.pdf"), attachments)).toEqual([]);
  });

  it("skips a name that matches no attachment", () => {
    expect(selectReplicatedReferences(source("ghost.png"), attachments)).toEqual([]);
  });

  it("never sends the same file twice", () => {
    const picked = selectReplicatedReferences(
      source("reference.png\nreference.png"),
      attachments,
    );

    expect(picked).toEqual([png]);
  });

  it("caps how many references are sent", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      name: `r${i}.png`,
      mimeType: "image/png",
    }));
    const manifest = many.map((a) => a.name).join("\n");

    expect(selectReplicatedReferences(source(manifest), many)).toHaveLength(4);
  });

  it("finds the manifest even when the agent named it in another case", () => {
    const picked = selectReplicatedReferences(
      { "replication.md": "reference.png" },
      attachments,
    );

    expect(picked).toEqual([png]);
  });
});
