import { describe, expect, it } from "vitest";

import {
  resolvePlaceSections,
  resolvePlacesLayout,
  shouldRenderPlaces,
} from "@/lib/places";
import type { PlaceSection, PlacesConfig } from "@/lib/types";

const section = (over: Partial<PlaceSection>): PlaceSection => ({
  id: "s1",
  title: "Hotéis",
  items: [],
  ...over,
});

const cfg = (over: Partial<PlacesConfig>): PlacesConfig => ({
  enabled: true,
  layout: "stacked",
  sections: [],
  ...over,
});

describe("resolvePlaceSections", () => {
  it("returns [] for missing / empty", () => {
    expect(resolvePlaceSections(undefined)).toEqual([]);
    expect(resolvePlaceSections(cfg({ sections: [] }))).toEqual([]);
  });
  it("drops items without a title and sections left empty", () => {
    const out = resolvePlaceSections(
      cfg({
        sections: [
          section({
            id: "a",
            items: [
              { id: "1", title: "" },
              { id: "2", title: "Hotel X" },
            ],
          }),
          section({ id: "b", items: [{ id: "3", title: "   " }] }),
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
    expect(out[0].items).toHaveLength(1);
    expect(out[0].items[0].title).toBe("Hotel X");
  });
  it("keeps multiple sections that each have a titled item", () => {
    const out = resolvePlaceSections(
      cfg({
        sections: [
          section({ id: "a", title: "Hotéis", items: [{ id: "1", title: "H" }] }),
          section({
            id: "b",
            title: "Restaurantes",
            items: [{ id: "2", title: "R" }],
          }),
        ],
      }),
    );
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("shouldRenderPlaces", () => {
  it("false when missing, disabled, or no usable items", () => {
    expect(shouldRenderPlaces({ places: undefined })).toBe(false);
    expect(
      shouldRenderPlaces({
        places: cfg({
          enabled: false,
          sections: [section({ items: [{ id: "1", title: "Hotel" }] })],
        }),
      }),
    ).toBe(false);
    expect(
      shouldRenderPlaces({ places: cfg({ sections: [section({ items: [] })] }) }),
    ).toBe(false);
  });
  it("true when enabled with at least one titled item", () => {
    expect(
      shouldRenderPlaces({
        places: cfg({
          sections: [section({ items: [{ id: "1", title: "Hotel" }] })],
        }),
      }),
    ).toBe(true);
  });
});

describe("resolvePlacesLayout", () => {
  it("returns rows only when explicitly set, stacked otherwise", () => {
    expect(resolvePlacesLayout(cfg({ layout: "rows" }))).toBe("rows");
    expect(resolvePlacesLayout(cfg({ layout: "stacked" }))).toBe("stacked");
    expect(resolvePlacesLayout(undefined)).toBe("stacked");
  });
});
