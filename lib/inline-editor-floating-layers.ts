export const INLINE_EDITOR_FLOATING_LAYER_SELECTOR =
  "[data-font-picker-dropdown], [data-font-upload-dialog]";

export function isInlineEditorFloatingLayerTarget(target: unknown): boolean {
  if (!target || typeof target !== "object" || !("closest" in target)) {
    return false;
  }
  const closest = target.closest;
  if (typeof closest !== "function") return false;
  return Boolean(
    closest.call(target, INLINE_EDITOR_FLOATING_LAYER_SELECTOR),
  );
}
