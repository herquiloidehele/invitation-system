import { describe, expect, it } from "vitest";

import {
  isPlainCardStyle,
  resolveCardSurfaceStyle,
  setCardStyleField,
} from "@/lib/card-styles";

const decorated = {
  background: "#ffffff",
  border: "1px solid #eadfce",
  borderRadius: 24,
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

describe("plain card styles", () => {
  it("activates only for the literal true value", () => {
    expect(isPlainCardStyle()).toBe(false);
    expect(isPlainCardStyle({})).toBe(false);
    expect(isPlainCardStyle({ plain: false })).toBe(false);
    expect(isPlainCardStyle({ plain: true })).toBe(true);
  });

  it("returns existing decoration unchanged outside plain mode", () => {
    expect(resolveCardSurfaceStyle(undefined, decorated)).toEqual(decorated);
    expect(resolveCardSurfaceStyle({ plain: false }, decorated)).toEqual(
      decorated,
    );
  });

  it("removes every decorative surface property in plain mode", () => {
    expect(resolveCardSurfaceStyle({ plain: true }, decorated)).toEqual({
      background: "transparent",
      border: "none",
      borderRadius: 0,
      boxShadow: "none",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
    });
  });

  it("does not introduce layout or image properties", () => {
    const result = resolveCardSurfaceStyle({ plain: true }, decorated);
    expect(result).not.toHaveProperty("padding");
    expect(result).not.toHaveProperty("margin");
    expect(result).not.toHaveProperty("overflow");
    expect(result).not.toHaveProperty("backgroundImage");
  });

  it("preserves saved fields when plain mode is enabled and disabled", () => {
    const initial = {
      faqs: {
        cardBg: "#ffffff",
        cardBorder: "#eadfce",
        borderRadius: 24,
      },
    };
    const enabled = setCardStyleField(initial, "faqs", "plain", true);
    expect(enabled?.faqs).toEqual({ ...initial.faqs, plain: true });
    const disabled = setCardStyleField(enabled, "faqs", "plain", undefined);
    expect(disabled?.faqs).toEqual(initial.faqs);
  });

  it("removes empty section and root override objects", () => {
    expect(
      setCardStyleField(
        { schedule: { plain: true } },
        "schedule",
        "plain",
        undefined,
      ),
    ).toBeUndefined();
  });
});
