import { describe, expect, it } from "vitest";

import { resolveSelectedRsvpSlug } from "@/lib/admin-rsvp-defaults";

const items = [{ slug: "newest" }, { slug: "older" }];

describe("resolveSelectedRsvpSlug", () => {
  it("keeps a valid selected slug", () => {
    expect(resolveSelectedRsvpSlug("older", items)).toBe("older");
  });

  it("defaults missing selection to the first item", () => {
    expect(resolveSelectedRsvpSlug(undefined, items)).toBe("newest");
    expect(resolveSelectedRsvpSlug(null, items)).toBe("newest");
  });

  it("defaults unknown selection to the first item", () => {
    expect(resolveSelectedRsvpSlug("unknown", items)).toBe("newest");
  });

  it("returns null when no items exist", () => {
    expect(resolveSelectedRsvpSlug(undefined, [])).toBeNull();
  });
});
