import type {
  InvitationData,
  PlaceSection,
  PlacesConfig,
  PlacesLayout,
} from "./types";

/**
 * Sections that have at least one titled item. Item lists are pruned to
 * titled items only, so the renderer never shows empty rows.
 */
export function resolvePlaceSections(
  places: PlacesConfig | undefined | null,
): PlaceSection[] {
  if (!places?.sections?.length) return [];
  return places.sections
    .map((section) => ({
      ...section,
      items: (section.items ?? []).filter((it) => !!it?.title?.trim()),
    }))
    .filter((section) => section.items.length > 0);
}

/** True when the Places feature should render. */
export function shouldRenderPlaces(
  invitation: Pick<InvitationData, "places">,
): boolean {
  const p = invitation.places;
  return p?.enabled === true && resolvePlaceSections(p).length > 0;
}

/** Resolve the layout, defaulting to "stacked". */
export function resolvePlacesLayout(
  places: PlacesConfig | undefined | null,
): PlacesLayout {
  return places?.layout === "rows" ? "rows" : "stacked";
}
