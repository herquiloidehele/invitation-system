import { describe, expect, it } from "vitest";

import { getGuestFormShellVariant } from "../components/admin/guest-form-sheet";

describe("getGuestFormShellVariant", () => {
  it("uses drawer on mobile", () => {
    expect(getGuestFormShellVariant(true)).toBe("drawer");
  });

  it("uses sheet on desktop", () => {
    expect(getGuestFormShellVariant(false)).toBe("sheet");
  });
});
