import { describe, expect, it } from "vitest";

import { resolveRsvpPageView } from "@/lib/rsvp-page-view";

const live = { closed: false, deadlinePassed: false } as const;

describe("resolveRsvpPageView — live page", () => {
  it("shows closed before anything else", () => {
    expect(
      resolveRsvpPageView({
        closed: true,
        deadlinePassed: true,
        submitState: "success",
      }),
    ).toBe("closed");
  });

  it("shows the deadline panel before submission states", () => {
    expect(
      resolveRsvpPageView({
        closed: false,
        deadlinePassed: true,
        submitState: "already_submitted",
      }),
    ).toBe("deadline");
  });

  it("maps submit states", () => {
    expect(resolveRsvpPageView({ ...live, submitState: "idle" })).toBe("form");
    expect(resolveRsvpPageView({ ...live, submitState: "loading" })).toBe("form");
    expect(
      resolveRsvpPageView({ ...live, submitState: "already_submitted" }),
    ).toBe("already");
    expect(resolveRsvpPageView({ ...live, submitState: "success" })).toBe(
      "success",
    );
    expect(resolveRsvpPageView({ ...live, submitState: "error" })).toBe("error");
  });
});

describe("resolveRsvpPageView — admin preview", () => {
  it("follows the chosen state and ignores closed/deadline", () => {
    const base = { closed: true, deadlinePassed: true, submitState: "idle" } as const;
    expect(resolveRsvpPageView({ ...base, previewState: "form" })).toBe("form");
    expect(resolveRsvpPageView({ ...base, previewState: "success" })).toBe(
      "success",
    );
    expect(resolveRsvpPageView({ ...base, previewState: "already" })).toBe(
      "already",
    );
    expect(resolveRsvpPageView({ ...base, previewState: "closed" })).toBe(
      "closed",
    );
  });

  it("shows success after submitting the preview form", () => {
    expect(
      resolveRsvpPageView({
        ...live,
        submitState: "success",
        previewState: "form",
      }),
    ).toBe("success");
  });
});
