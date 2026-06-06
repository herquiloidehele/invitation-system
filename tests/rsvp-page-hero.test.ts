import { describe, expect, it } from "vitest";
import { pickRsvpHeroSource } from "@/lib/rsvp-page-hero";

describe("pickRsvpHeroSource", () => {
  it("prefers adminBackgroundOverride above everything else", () => {
    const result = pickRsvpHeroSource({
      adminBackgroundOverride: "https://example.com/admin.jpg",
      cinematicImageUrl: "https://example.com/cinematic.jpg",
      videoPoster: "https://example.com/poster.jpg",
    });
    expect(result).toBe("https://example.com/admin.jpg");
  });

  it("uses cinematicImageUrl when no admin override is present", () => {
    const result = pickRsvpHeroSource({
      cinematicImageUrl: "https://example.com/cinematic.jpg",
      videoPoster: "https://example.com/poster.jpg",
    });
    expect(result).toBe("https://example.com/cinematic.jpg");
  });

  it("uses videoPoster when neither override nor cinematic is set", () => {
    const result = pickRsvpHeroSource({
      videoPoster: "https://example.com/poster.jpg",
    });
    expect(result).toBe("https://example.com/poster.jpg");
  });

  it("returns null when nothing is set so caller can render the themed gradient", () => {
    const result = pickRsvpHeroSource({});
    expect(result).toBeNull();
  });

  it("treats empty strings as not set", () => {
    const result = pickRsvpHeroSource({
      adminBackgroundOverride: "",
      cinematicImageUrl: "",
      videoPoster: "",
    });
    expect(result).toBeNull();
  });

  it("ignores videoUrl on its own (only videoPoster counts as a usable still source)", () => {
    const result = pickRsvpHeroSource({
      videoUrl: "https://example.com/video.mp4",
    });
    expect(result).toBeNull();
  });
});
