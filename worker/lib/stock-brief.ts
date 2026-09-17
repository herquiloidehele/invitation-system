/**
 * The prompt block that turns the stock-image tools into something the agent
 * reaches for on its own.
 *
 * Per-turn, never in the system prompt: the system prompt must stay
 * byte-identical across turns or a resumed session re-uploads its whole prefix.
 *
 * `replicating` swaps the closing advice rather than contradicting it. "Using no
 * photograph at all is a fine answer" is true when the agent is choosing the
 * design and false when a reference already shows photographs, so the wrong one
 * is simply not emitted.
 */
export function buildStockBrief(replicating: boolean = false): string {
  return [
    "Stock photography:",
    "You can search Pexels, Unsplash and Pixabay from inside this build with",
    "`search_images`, and claim one with `use_image`. Reach for them whenever the",
    "design would be stronger with a photograph this invitation does not already",
    "supply — a cover background, a texture, a section break, an atmosphere shot.",
    "",
    "- Search in English and describe the picture, not the occasion: 'olive grove",
    "  golden hour', 'white peonies on linen shot from above', 'hand-torn paper",
    "  texture'. Search again with different words if the first set is weak.",
    "- `search_images` downloads previews into refs/stock/. Open two or three of",
    "  them with Read and actually look before you choose — the descriptions tell",
    "  you nothing about whether a photo is beautiful.",
    "- `use_image` copies your pick to permanent storage and returns its URL. That",
    "  URL is the only one that may appear in the source: never a provider URL,",
    "  never a refs/stock path. Put it in <Media src>.",
    "- Record the credit line `use_image` returns as a comment above the section",
    "  that uses the photo.",
    "- A stock photo may carry the mood, people included. It must never stand in",
    "  for this couple or a named guest — no stock face next to their names, no",
    "  caption that reads as if it were them.",
    "- Their own photographs always win where they exist (props.assets).",
    ...(replicating
      ? [
          "- Fill every image slot the reference has. Search for its subject, crop",
          "  and tone rather than for a picture you like better — matching it is",
          "  the job.",
          "- Those photographs are placeholders: the admin replaces them with the",
          "  couple's own. Choose for composition first, and say at the end of the",
          "  turn which ones are stand-ins.",
        ]
      : [
          "- Using no photograph at all is a fine answer. A confident typographic",
          "  design beats a decorated one.",
        ]),
  ].join("\n");
}
