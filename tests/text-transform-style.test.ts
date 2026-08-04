import { describe, expect, it } from "vitest";
import { applyOverride } from "@/lib/text-styles";

describe("text-transform style overrides", () => {
  it("preserves the template transform when no override is provided", () => {
    expect(applyOverride({ textTransform: "uppercase" })).toEqual({
      textTransform: "uppercase",
    });
  });

  it("applies an uppercase override", () => {
    expect(
      applyOverride({ textTransform: "none" }, { textTransform: "uppercase" }),
    ).toMatchObject({ textTransform: "uppercase" });
  });

  it("applies a lowercase override", () => {
    expect(
      applyOverride(
        { textTransform: "uppercase" },
        { textTransform: "lowercase" },
      ),
    ).toMatchObject({ textTransform: "lowercase" });
  });

  it("uses an explicit none override to disable a template transform", () => {
    expect(
      applyOverride({ textTransform: "uppercase" }, { textTransform: "none" }),
    ).toMatchObject({ textTransform: "none" });
  });
});
