import { describe, expect, it } from "vitest";

import {
  attachmentPath,
  buildAttachmentBrief,
} from "@/worker/lib/attachment-brief";

const image = {
  id: "att1",
  name: "moodboard.png",
  kind: "image",
  mimeType: "image/png",
  objectKey: "k1",
  url: "https://cdn/moodboard.png",
  width: 800,
  height: 600,
};

const pdf = {
  id: "att2",
  name: "guide.pdf",
  kind: "pdf",
  mimeType: "application/pdf",
  objectKey: "k2",
  url: "https://cdn/guide.pdf",
  width: null,
  height: null,
};

describe("attachmentPath", () => {
  it("places files under refs/", () => {
    expect(attachmentPath("a.png")).toBe("refs/a.png");
  });
});

describe("buildAttachmentBrief", () => {
  it("is empty when there is nothing attached", () => {
    expect(buildAttachmentBrief([])).toBe("");
  });

  it("lists each file with its id, local path and url", () => {
    const brief = buildAttachmentBrief([image]);
    expect(brief).toContain("att1");
    expect(brief).toContain("refs/moodboard.png");
    expect(brief).toContain("https://cdn/moodboard.png");
  });

  it("states the inference rule and forbids hardcoded urls", () => {
    const brief = buildAttachmentBrief([image]).toLowerCase();
    expect(brief).toContain("conversation");
    expect(brief).toContain("props.assets.library");
    expect(brief).toContain("never hardcode");
  });

  it("tells the agent to ask when an image is ambiguous", () => {
    const brief = buildAttachmentBrief([image]);
    expect(brief).toContain("NEEDS_INPUT.md");
  });

  it("marks pdfs as always reference and never a question", () => {
    const brief = buildAttachmentBrief([pdf]);
    expect(brief).toContain('kind "pdf" are ALWAYS reference only');
    expect(brief).toContain("never ask about them");
  });
});
