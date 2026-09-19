import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

/**
 * The admin template preview has to render the same page component the public
 * renderer picks for that theme's `layout`. Rendering InvitationPage for every
 * theme made every template preview look like the default one.
 */
describe("admin theme preview honours theme.layout", () => {
  it("dispatches on layout through the shared helpers", () => {
    const source = read("components/admin/ThemeLayoutPreview.tsx");
    expect(source).toContain("isMinimalismBrownLayout");
    expect(source).toContain("isElegantFloralLayout");
    expect(source).toContain("<MinimalismBrownPage");
    expect(source).toContain("<ElegantFloralPage");
    expect(source).toContain("<InvitationPage");
  });

  it("keeps the admin page usable for the scroll-locking entrance layouts", () => {
    const source = read("components/admin/ThemeLayoutPreview.tsx");
    // Those two pages call useRevealScrollLock, which pins document.body —
    // embedding them would freeze the admin editor around the preview.
    expect(source).toContain("isCurtainCanvaLayout");
    expect(source).toContain("isVideoEntranceLayout");
    expect(source).not.toContain("<CurtainCanvaPage");
    expect(source).not.toContain("<VideoEntrancePage");
    expect(source).not.toContain('from "@/components/curtain-canva');
    expect(source).not.toContain('from "@/components/video-entrance');
  });

  it.each([
    "components/admin/ThemeForm.tsx",
    "app/admin/templates/[name]/ThemeViewClient.tsx",
  ])("renders the preview through ThemeLayoutPreview in %s", (file) => {
    const source = read(file);
    expect(source).toContain("<ThemeLayoutPreview");
    // No surface may hard-code the default page any more.
    expect(source).not.toContain("<InvitationPage");
  });

  it("offers every supported layout in the admin layout picker", () => {
    const union = read("lib/types.ts").match(
      /layout\?:\s*((?:\s*\|\s*"[a-z-]+")+);/,
    );
    expect(union).not.toBeNull();
    const layouts = [...union![1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
    expect(layouts).toContain("minimalism-brown");

    const form = read("components/admin/ThemeForm.tsx");
    for (const layout of layouts) {
      expect(form).toContain(`<option value="${layout}">`);
    }
  });
});
