export type ImageLayerEditorModeAction =
  | { type: "set-editing"; editing: boolean }
  | { type: "image-added" }
  | { type: "items-changed"; itemCount: number };

export function imageLayerEditorModeReducer(
  editing: boolean,
  action: ImageLayerEditorModeAction,
): boolean {
  switch (action.type) {
    case "set-editing":
      return action.editing;
    case "image-added":
      return true;
    case "items-changed":
      return action.itemCount > 0 && editing;
  }
}

/** Whether the admin's pointer-capturing image overlay may cover the preview. */
export function isImageLayerEditorActive(
  itemCount: number,
  editing: boolean,
): boolean {
  return itemCount > 0 && editing;
}
