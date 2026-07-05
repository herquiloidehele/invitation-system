/**
 * Keeps the editor overlay aligned with its preview while either the preview
 * or the page moves.
 */
export function observeImageLayerEditor(
  preview: EventTarget | null,
  viewport: EventTarget,
  onMeasure: () => void,
): () => void {
  onMeasure();
  preview?.addEventListener("scroll", onMeasure, true);
  viewport.addEventListener("resize", onMeasure);
  viewport.addEventListener("scroll", onMeasure, true);

  return () => {
    preview?.removeEventListener("scroll", onMeasure, true);
    viewport.removeEventListener("resize", onMeasure);
    viewport.removeEventListener("scroll", onMeasure, true);
  };
}
